import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const results = await db.patient.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: q } },
        { uhid: { contains: q } },
        { phone: { contains: q } },
        {
          visits: {
            some: {
              tokenNumber: { contains: q },
            },
          },
        },
      ],
    },
    take: 10,
    select: {
      id: true,
      name: true,
      uhid: true,
      ageYears: true,
      gender: true,
      phone: true,
    },
  });

  return NextResponse.json({ results });
}
