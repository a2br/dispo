import { ogSize, shareCard } from "@/lib/og";

export const alt = "dispo: see when your EPFL friends are free";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return shareCard({ title: "Who’s free right now?", subtitle: "See your friends’ EPFL timetables side by side and find a time in one look." });
}
