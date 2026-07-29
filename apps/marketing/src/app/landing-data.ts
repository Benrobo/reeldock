export const aspectRatios = [
  { id: "16:9", use: "Site hero, YouTube", aspect: 16 / 9, height: 224 },
  { id: "9:16", use: "Reels, Shorts, TikTok", aspect: 9 / 16, height: 312 },
  { id: "1:1", use: "Feed posts, X", aspect: 1, height: 258 },
] as const;

export const phoneRows = [
  { number: "1", title: "Proverbs 3", sub: "4 min read" },
  { number: "2", title: "Psalm 27", sub: "3 min read" },
  { number: "3", title: "Reflection", sub: "Write a note" },
] as const;

export const facts = [
  { value: "3", label: "sources, recorded at once" },
  { value: "1", label: "clock keeping them in step" },
  { value: "3", label: "shapes from the same take" },
  { value: "0", label: "files sent to a server" },
] as const;

export const steps = [
  {
    number: "01",
    title: "Plug in your phone",
    text: "ReelDock spots it over the cable and shows you the screen straight away.",
  },
  {
    number: "02",
    title: "Press record",
    text: "Phone, camera, and microphone all start together on one clock.",
  },
  {
    number: "03",
    title: "Tidy it up",
    text: "Drag things where you want them, change the canvas, and cut the dead air at the start.",
  },
  {
    number: "04",
    title: "Export",
    text: "An MP4 on your desktop, in the shape you asked for.",
  },
] as const;

export const features = [
  {
    title: "Your phone, over the cable",
    text: "No local screen recorder on the phone, no mirroring app, no watermark. Plug it in and the Mac reads it directly.",
  },
  {
    title: "You, if you want to be there",
    text: "Add your webcam as a circle or a soft rectangle, park it in a corner, or leave it out entirely.",
  },
  {
    title: "Change your mind later",
    text: "Move the phone, resize the camera, swap the background. The recording underneath never changes.",
  },
  {
    title: "Cut the awkward start",
    text: "Trim the top and tail before exporting without opening another editor.",
  },
  {
    title: "Backgrounds that suit you",
    text: "A plain color, a quiet neutral, or an image of your own behind the phone.",
  },
  {
    title: "Stays on your Mac",
    text: "Recordings sit in a normal folder. Nothing is uploaded, nothing is rendered in someone else's cloud.",
  },
] as const;

export const notYet = [
  "A full timeline editor",
  "Transitions and effects",
  "Automatic zooms",
  "AI captions",
  "Cloud rendering",
  "Team libraries",
  "A template store",
  "Cursor effects",
  "A teleprompter",
  "Windows",
  "Android, for now",
  "Recording your Mac screen",
] as const;

export const needs = [
  {
    tag: "Required",
    title: "A Mac",
    text: "Anything reasonably recent running a current version of macOS. Apple silicon is happiest.",
  },
  {
    tag: "Required",
    title: "An iPhone and a cable",
    text: "The cable you already charge with. You will tap Trust once and never think about it again.",
  },
  {
    tag: "Optional",
    title: "A camera and a mic",
    text: "The built-in ones are fine. Plug in something nicer if you have it.",
  },
] as const;

export const faqs = [
  {
    question: "Do I have to install something on my phone?",
    answer:
      "No. You plug it into your Mac with a cable and the Mac picks up the screen. The first time, your phone asks if it can trust the computer. Tap yes and that is the setup done.",
  },
  {
    question: "Will it record the sound coming out of my phone?",
    answer:
      "If your phone passes audio down the cable, ReelDock will keep it as its own source. If it does not, you still have your microphone, which is what most demos use for narration.",
  },
  {
    question: "What about notifications and the bit at the top of the screen?",
    answer:
      "ReelDock captures what is on your phone, including timers, calls, and active Live Activities. The live preview lets you clear anything noisy before recording.",
  },
  {
    question: "Can I move the camera bubble after recording?",
    answer:
      "Yes. Move it, shrink it, make it a circle, or hide it completely. The phone, camera, and microphone recordings stay separate until export.",
  },
  {
    question: "Is there an Android version?",
    answer:
      "Not yet. The first release is iPhone first, with Android planned after that capture path is reliable.",
  },
  {
    question: "Where do my recordings live?",
    answer:
      "In a folder on your Mac, next to a small project file. Nothing is uploaded anywhere by default, and there is no cloud render step.",
  },
  {
    question: "What will it cost?",
    answer:
      "Pricing is not decided yet. The waitlist hears first, and early people will not get a worse deal than anyone else.",
  },
] as const;
