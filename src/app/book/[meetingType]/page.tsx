import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BookingClient } from "./BookingClient";
import { getSiteSettings } from "@/lib/get-site-settings";

interface Props {
  params: Promise<{ meetingType: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { meetingType: slug } = await params;
  const mt = await prisma.meetingType.findUnique({ where: { slug } });
  if (!mt) return { title: "Meeting Not Found" };
  const settings = await getSiteSettings();

  const title = `Book ${mt.name} | ${settings.siteName}`;
  const description = mt.description || `Schedule a ${mt.duration}-minute ${mt.name} with ${settings.siteName}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: settings.siteName,
      images: [{ url: settings.ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [settings.ogImage],
    },
  };
}

export default async function BookingPage({ params }: Props) {
  const { meetingType: slug } = await params;
  const meetingType = await prisma.meetingType.findUnique({ where: { slug } });
  if (!meetingType || !meetingType.isActive) notFound();

  return <BookingClient meetingType={meetingType} />;
}