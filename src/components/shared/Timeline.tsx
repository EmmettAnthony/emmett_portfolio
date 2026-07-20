"use client";

import { motion } from "framer-motion";

interface TimelineItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string[];
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 h-full w-px bg-zinc-200 dark:bg-zinc-800" />

      <div className="space-y-12">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="relative pl-12"
          >
            {/* Dot */}
            <div className="absolute left-2.5 top-1 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-blue-700 bg-white dark:bg-zinc-950" />

            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
                {item.date}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-400">
                {item.subtitle}
              </p>
              <ul className="mt-3 space-y-2">
                {item.description.map((desc, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed text-muted-foreground dark:text-zinc-400"
                  >
                    {desc}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
