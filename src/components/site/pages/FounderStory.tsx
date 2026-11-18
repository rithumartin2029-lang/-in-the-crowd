"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";

const PARAGRAPHS = [
  "There was a time when my phone became my front row seat.",
  "Every time my favourite artist walked onto a stage, I was somewhere else: in a classroom, in a hostel room, in a city too far away, or simply without the means to be there. I watched the stories. I replayed the shaky videos. I listened to strangers scream the words I knew by heart, and I smiled, and then I felt that quiet ache that only people who have missed something they love will understand.",
  "I missed one concert. Then another. Then so many that I stopped counting.",
  "I'm a college student studying coding, and one night I realised something: instead of only feeling that ache, I could build something from it. So I took my own heartbreak and turned it into my problem statement. If I felt this way, I knew I couldn't be the only one.",
  "And I wasn't. Out there are thousands of people sitting at home with the same lump in their throat, wishing they could stand in that crowd for just one song.",
  "That is how this website began. It is a place for the ones who made it, so their memories never fade. For the ones who missed it, so they never have to feel left out. And for the ones still dreaming, so the dream stays alive until the day it comes true.",
  "This isn't just a website to me. It is the thing I wished existed on every night I wasn't there.",
  "So wherever you are tonight, whether in the front row or watching from home, remember:",
  "Somewhere, we're all in the crowd.",
];

export default function FounderStory() {
  const { auth, navigate } = useStore();
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-accent/5 to-transparent" />
      <article className="relative mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">A note from the founder</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Where It All Began</h1>
        </motion.div>

        <div className="space-y-6">
          {PARAGRAPHS.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.05 * i }}
              className="text-lg leading-relaxed text-foreground/90 first-letter:ml-0"
            >
              {p}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-10 border-t border-border/40 pt-6 text-center"
        >
          <p className="text-sm italic text-muted-foreground">With love,<br />The founder of this website 💙</p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => navigate(auth ? "home" : "auth")} className="gap-2">
              Join the crowd. <ArrowRight className="size-4" />
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            For the ones who made it. For the ones who missed it. For the ones still dreaming.
          </p>
        </motion.div>
      </article>
    </div>
  );
}
