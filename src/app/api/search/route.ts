import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q || q.trim() === '') {
    return NextResponse.json([]);
  }

  try {
    const workflows = await prisma.workflow.findMany({
      where: { name: { contains: q } },
      take: 5,
      select: { id: true, name: true, isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
