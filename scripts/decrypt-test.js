const crypto = require("crypto");
const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function decrypt(text) {
  const parts = text.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted text format");
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = Buffer.from(parts[1], "hex");
  const authTag = Buffer.from(parts[2], "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY, "hex"), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, undefined, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

console.log("Decrypted key:", decrypt("1af3bf31a547e3b3c8cb59313d59c0bf:9109b671d34ecce5a3feb38b7bc2a481d2ac709a7329ef5a3ea24aa057b58f61a7f9d973dd8cd41c92f1410069a79ac580dff191940dc4c0f8afe45b0e118476e36f3912f849596e4b:3ef3a09ad696c03db2b0b5369b8ca28f"));
