import fs from "fs";
import path from "path";

export async function publishToCMS(
  integration: any,
  destConfigStr: string | null,
  post: { title: string; summary?: string; content: string; sourceUrl?: string; metaTitle?: string; metaDescription?: string; tags?: string; },
  imagePath?: string,
  cmsContentFormat: string = "HTML",
  useNofollowLinks: boolean = true
): Promise<string> {
  const type = integration.type.toUpperCase();
  // credentials is stored as a JSON string in the DB
  const rawCredentials = typeof integration.credentials === "string"
    ? JSON.parse(integration.credentials)
    : integration.credentials;

  // Dynamically import to avoid circular dependency issues at the top level
  const { decryptIntegrationCredentials } = await import("@/lib/crypto/api-keys");
  const credentials = decryptIntegrationCredentials(rawCredentials);

  
  if (type === "WORDPRESS") {
    const { url, username, password } = credentials as any;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    
    const htmlContent = convertToHtml(post.content, useNofollowLinks);

    const res = await fetch(`${url}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify({
        title: post.title,
        content: htmlContent,
        status: "publish",
        format: "standard"
      })
    });
    
    if (!res.ok) throw new Error(`WordPress error: ${await res.text()}`);
    const data = await res.json();
    return data.link; // The live CMS URL
  }
  
  if (type === "PAYLOADCMS") {
    let { url, apiKey, email, password, categoryId, authorId, categoryMappings } = credentials as any;
    
    // Default placeholders if not configured in the UI yet
    const adminEmail = email || "your-admin-email@legalsuvidha.com";
    const adminPassword = password || "your-admin-password";
    
    // Determine the exact post endpoint
    let postUrl = url;
    if (!postUrl.includes("/api/")) {
      postUrl = `${postUrl.replace(/\/$/, "")}/api/posts`;
    } else {
      // Strip any trailing ID or query params, e.g. /api/services/2?depth=2 -> /api/services
      try {
        const urlObj = new URL(postUrl);
        let urlPath = urlObj.pathname;
        if (/\/\d+$/.test(urlPath)) {
          urlPath = urlPath.replace(/\/\d+$/, "");
        }
        postUrl = `${urlObj.origin}${urlPath}`;
      } catch (e) {}
    }

    const docSlug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    // Convert content depending on requested format
    let contentPayload: any = "";
    if (cmsContentFormat === "HTML") {
      contentPayload = convertToHtml(post.content, useNofollowLinks);
    } else {
      contentPayload = convertToLexical(post.content, useNofollowLinks);
    } // Upload Hero Image if provided
    let mediaId = null;
    if (imagePath) {
      try {
        const fullImagePath = path.join(process.cwd(), "public", imagePath);
        if (fs.existsSync(fullImagePath)) {
          const fileBuffer = fs.readFileSync(fullImagePath);
          const fileName = path.basename(fullImagePath);
          const fileBlob = new Blob([fileBuffer], { type: "image/png" });
          const formData = new FormData();
          formData.append("file", fileBlob, fileName);
          formData.append("_payload", JSON.stringify({ alt: "Featured Image" }));
          
          // 1. Log in to get secure JWT token
          const loginUrl = new URL(postUrl).origin + "/api/users/login";
          const cmsOrigin = new URL(postUrl).origin;
          const loginRes = await fetch(loginUrl, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Origin": cmsOrigin,
              "Referer": `${cmsOrigin}/`
            },
            body: JSON.stringify({ email: adminEmail, password: adminPassword })
          });
          
          const errText = await loginRes.text();
          let loginData: any = {};
          try { loginData = JSON.parse(errText); } catch(e) {}
          
          const token = loginData.token || loginData.user?.token;
 
          if (!token) {
            const reason = loginData.message || (loginData.errors && loginData.errors[0]?.message) || errText || "Invalid credentials";
            throw new Error(`Failed to log in to Payload CMS. Reason: ${reason}`);
          }
 
          // 2. Upload image using the JWT token
          const mediaUrl = new URL(postUrl).origin + "/api/media";
          const mediaRes = await fetch(mediaUrl, {
            method: "POST",
            headers: {
              "Authorization": `JWT ${token}`,
              "Origin": cmsOrigin,
              "Referer": `${cmsOrigin}/`
            },
            body: formData as any
          });
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            let rawMediaId = mediaData.doc?.id || mediaData.id;
            mediaId = !isNaN(Number(rawMediaId)) ? Number(rawMediaId) : rawMediaId;
            console.log(`[Publish] Uploaded image to Payload, media ID: ${mediaId}`);
          } else {
            const errTxt = await mediaRes.text();
            console.warn(`[Publish] Failed to upload image to Payload: ${errTxt}`);
            throw new Error(`Failed to upload media to ${mediaUrl}: ${errTxt}`);
          }
        }
      } catch (err: any) {
        console.warn(`[Publish] Error uploading image (gracefully skipping): ${err.message}`);
        // Do not throw, publish the post without featured image
      }
    }

    const payloadBody: any = {
      title: post.title,
      slug: docSlug,
      content: contentPayload, // HTML string or Lexical editor structure (e.g. blogs collection)
      heroContent: contentPayload, // HTML string or Lexical editor structure (e.g. services collection)
      excerpt: post.summary || post.metaDescription || post.title.substring(0, 150), // blogs collection
      shortDescription: post.summary || post.metaDescription || post.title.substring(0, 150), // services collection
      summary: post.summary, // Pass summary directly if the collection uses that exact key
      sourceUrl: post.sourceUrl, // Send source link data explicitly
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      meta: {
        title: post.metaTitle || post.title,
        description: post.metaDescription || ""
      },
      status: "published", // Standard status
      _status: "published", // Payload draft/publish status field
      publishedAt: new Date().toISOString()
    };

    if (mediaId) {
      payloadBody.featuredImage = mediaId;
    }
    if (categoryMappings && Array.isArray(categoryMappings) && categoryMappings.length > 0) {
      let forcedMappingName = null;
      if (destConfigStr) {
        try {
          const cfg = JSON.parse(destConfigStr);
          if (cfg.selectedMappingName) forcedMappingName = cfg.selectedMappingName;
        } catch(e) {}
      }

      let bestMatch = null;
      
      if (forcedMappingName) {
        bestMatch = categoryMappings.find(m => m.name === forcedMappingName);
        if (bestMatch) {
          console.log(`[Publish] Forced category mapping: ${bestMatch.name}`);
        }
      }

      if (!bestMatch) {
        // Find the best matching category from the list based on the post's title and tags
        let maxMatches = 0;
        const searchSpace = `${post.title} ${post.tags || ''}`.toLowerCase();
        
        for (const mapping of categoryMappings) {
          if (!mapping.name) continue;
          const mappingName = mapping.name.toLowerCase();
          let matches = 0;
          // Simple word match check
          if (searchSpace.includes(mappingName)) matches += 2;
          // Check partial word matches
          const mappingWords = mappingName.split(/\s+/);
          for (const word of mappingWords) {
            if (word.length > 3 && searchSpace.includes(word)) matches += 1;
          }

          if (matches > maxMatches) {
            maxMatches = matches;
            bestMatch = mapping;
          }
        }
        
        if (bestMatch && maxMatches > 0) {
          console.log(`[Publish] Auto-matched category mapping: ${bestMatch.name}`);
        } else {
          bestMatch = null; // Don't use if 0 matches
        }
      }

      if (bestMatch) {
        categoryId = bestMatch.categoryId || categoryId;
        authorId = bestMatch.authorId || authorId;
      }
    }

    if (categoryId) {
      // Allow comma-separated multiple category IDs
      const ids = String(categoryId).split(',').map((id: string) => id.trim()).map((id: string) => !isNaN(Number(id)) ? Number(id) : id);
      payloadBody.category = ids.length === 1 ? ids[0] : ids;
      payloadBody.categories = ids; 
    }
    if (authorId) {
      payloadBody.author = !isNaN(Number(authorId)) ? Number(authorId) : authorId;
    }

    // 1. Log in to get secure JWT token (doing this again to ensure fresh token or if no media was uploaded)
    const loginUrl = new URL(postUrl).origin + "/api/users/login";
    const cmsOrigin = new URL(postUrl).origin;
    const loginRes = await fetch(loginUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Origin": cmsOrigin,
        "Referer": `${cmsOrigin}/`
      },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    
    const errText2 = await loginRes.text();
    let loginData2: any = {};
    try { loginData2 = JSON.parse(errText2); } catch(e) {}
    
    const token = loginData2.token || loginData2.user?.token;

    if (!token) {
      const reason = loginData2.message || (loginData2.errors && loginData2.errors[0]?.message) || errText2 || "Invalid credentials";
      throw new Error(`Failed to log in to Payload CMS before publishing post. Reason: ${reason}`);
    }

    const res = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `JWT ${token}`,
        "Origin": cmsOrigin,
        "Referer": `${cmsOrigin}/`
      },
      body: JSON.stringify(payloadBody)
    });
    
    if (!res.ok) throw new Error(`Payload CMS error: ${await res.text()}`);
    const data = await res.json();
    
    const docId = data.id || data.doc?.id || "";
    const slugValue = data.slug || data.doc?.slug || docId;
    const origin = new URL(postUrl).origin;
    
    // Get the collection slug from the API URL path (e.g. "services")
    const parts = postUrl.split("/api/");
    let collectionName = parts[1] || "posts";
    collectionName = collectionName.replace(/^\/+|\/+$/g, ""); // Strip trailing/leading slashes
    
    return `${origin}/${collectionName}/${slugValue}`;
  }
  
  throw new Error(`Unsupported CMS type: ${type}`);
}

export async function publishToSocial(integration: any, socialText: string, link: string) {
  const type = integration.type.toUpperCase();
  // credentials is stored as a JSON string in the DB
  const rawCredentials = typeof integration.credentials === "string"
    ? JSON.parse(integration.credentials)
    : integration.credentials;

  const { decryptIntegrationCredentials } = await import("@/lib/crypto/api-keys");
  const credentials = decryptIntegrationCredentials(rawCredentials);

  
  if (type === "TWITTER") {
    // Twitter v2 POST /tweets requires User Context (OAuth 2.0 User Access Token or OAuth 1.0a)
    // We expect the user to provide an OAuth 2.0 Access Token here.
    const { accessToken } = credentials as any; // Replaced bearerToken with accessToken
    
    let textWithLink = `${socialText}\n\n${link}`;
    if (textWithLink.length > 280) {
      const linkLength = link.length;
      const buffer = 10;
      const availableSpace = 280 - linkLength - buffer;
      const truncatedText = socialText.substring(0, availableSpace > 0 ? availableSpace : 0) + "...";
      textWithLink = `${truncatedText}\n\n${link}`;
    }

    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({ text: textWithLink })
    });
    
    if (!res.ok) throw new Error(`Twitter API error: ${await res.text()}`);
    const data = await res.json();
    return `https://twitter.com/user/status/${data.data.id}`;
  }
  
  if (type === "LINKEDIN") {
    const { accessToken, urn } = credentials as any;
    
    const textWithLink = `${socialText}\n\n${link}`;

    const res = await fetch("https://api.linkedin.com/v2/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "LinkedIn-Version": "2024-01",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify({
        author: `urn:li:person:${urn}`,
        commentary: textWithLink,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false
      })
    });
    
    if (!res.ok) throw new Error(`LinkedIn API error: ${await res.text()}`);
    const urnReturn = res.headers.get('x-restli-id');
    if (urnReturn) {
      const id = urnReturn.split(':').pop();
      return `https://www.linkedin.com/feed/update/urn:li:activity:${id}`;
    }
    return `https://www.linkedin.com/feed/`;
  }
  
  throw new Error(`Unsupported Social type: ${type}`);
}

function parseInlineMarkdown(text: string, useNofollowLinks: boolean = true) {
  const nodes: any[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const linkMatch = remaining.match(/\[(.*?)\]\((.*?)\)/);
    const newlineMatch = remaining.match(/\n/);
    
    const matches: { index: number; length: number; type: 'bold' | 'link' | 'newline'; match: any }[] = [];
    
    if (boldMatch && boldMatch.index !== undefined) {
      matches.push({ index: boldMatch.index, length: boldMatch[0].length, type: 'bold', match: boldMatch });
    }
    if (linkMatch && linkMatch.index !== undefined) {
      matches.push({ index: linkMatch.index, length: linkMatch[0].length, type: 'link', match: linkMatch });
    }
    if (newlineMatch && newlineMatch.index !== undefined) {
      matches.push({ index: newlineMatch.index, length: 1, type: 'newline', match: newlineMatch });
    }
    
    if (matches.length > 0) {
      matches.sort((a, b) => a.index - b.index);
      const earliestMatch = matches[0];
      
      if (earliestMatch.index > 0) {
        nodes.push({ text: remaining.slice(0, earliestMatch.index), type: "text", format: 0, version: 1, mode: "normal", style: "", detail: 0 });
      }
      
      if (earliestMatch.type === 'bold') {
        nodes.push({ text: earliestMatch.match[1], type: "text", format: 1, version: 1, mode: "normal", style: "", detail: 0 });
      } else if (earliestMatch.type === 'link') {
        nodes.push({
          type: "link",
          fields: {
            url: earliestMatch.match[2],
            newTab: true,
            linkType: "custom",
            rel: useNofollowLinks ? "noopener noreferrer nofollow" : "noopener noreferrer"
          },
          version: 2,
          children: [{ text: earliestMatch.match[1] || "Link", type: "text", format: 0, version: 1, mode: "normal", style: "", detail: 0 }],
          format: "",
          indent: 0,
          direction: "ltr"
        });
      } else if (earliestMatch.type === 'newline') {
        nodes.push({ type: "linebreak", version: 1 });
      }
      
      remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
    } else {
      nodes.push({ text: remaining, type: "text", format: 0, version: 1, mode: "normal", style: "", detail: 0 });
      break;
    }
  }
  return nodes.length > 0 ? nodes : [{ text, type: "text", format: 0, version: 1, mode: "normal", style: "", detail: 0 }];
}

function convertToLexical(markdown: string, useNofollowLinks: boolean = true) {
  if (!markdown) return null;
  
  // Normalize markdown by stripping carriage returns and ensuring headings have blank lines around them
  let normalized = markdown
    .replace(/\r/g, "")
    .replace(/^(#{1,6}\s+.+)$/gm, '\n\n$1\n\n');
    
  // Split by double newlines to get blocks (paragraphs, headers, lists)
  const blocks = normalized.split(/\n\s*\n/);
  const children: any[] = [];
  
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    
    // Heading: e.g. ## Heading text
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/m);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      children.push({
        type: "heading",
        tag: `h${level}`,
        format: "",
        indent: 0,
        version: 1,
        children: parseInlineMarkdown(text, useNofollowLinks),
        direction: "ltr"
      });
      continue;
    }
    
    // List: e.g. - Item 1\n- Item 2
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s+/.test(trimmed)) {
      const lines = trimmed.split("\n");
      const listItems: any[] = [];
      const isOrdered = /^\d+\.\s+/.test(trimmed);
      
      for (const line of lines) {
        const itemText = line.replace(/^[-*\d.]+\s+/, "").trim();
        if (itemText) {
          listItems.push({
            type: "listitem",
            value: listItems.length + 1,
            format: "",
            indent: 0,
            version: 1,
            children: parseInlineMarkdown(itemText, useNofollowLinks),
            direction: "ltr"
          });
        }
      }
      
      children.push({
        type: "list",
        tag: isOrdered ? "ol" : "ul",
        listType: isOrdered ? "number" : "bullet",
        start: 1,
        format: "",
        indent: 0,
        version: 1,
        children: listItems,
        direction: "ltr"
      });
      continue;
    }
    
    // Default Paragraph
    children.push({
      type: "paragraph",
      format: "",
      indent: 0,
      version: 1,
      children: parseInlineMarkdown(trimmed, useNofollowLinks),
      direction: "ltr"
    });
  }
  
  if (children.length === 0) {
    children.push({
      type: "paragraph",
      format: "",
      indent: 0,
      version: 1,
      children: [{ text: "", type: "text", format: 0, version: 1, mode: "normal", style: "", detail: 0 }],
      direction: "ltr"
    });
  }

  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      children,
      direction: "ltr"
    }
  };
}

function convertToHtml(markdown: string, useNofollowLinks: boolean = true): string {
  if (!markdown) return "";
  
  let html = markdown
    // Escape HTML special characters
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers (### to h3, etc.)
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Italics (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // Links ([text](url))
  if (useNofollowLinks) {
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$1</a>');
  } else {
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  // Images (![alt](url))
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />');

  // Unordered list items (- item)
  html = html.replace(/^\s*-\s+(.*)$/gim, "<li>$1</li>");
  // Wrap li in ul (simple grouping)
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");

  // Paragraphs (double newlines)
  html = html.split(/\n\s*\n/).map(p => {
    const trimmed = p.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<li") || trimmed.startsWith("<img")) {
      return trimmed;
    }
    return `<p>${trimmed}</p>`;
  }).join("\n");

  return html;
}
