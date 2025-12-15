export interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
}

export const questions: Question[] = [
  {
    id: 1,
    question: "Male or Female?",
    optionA: "Male",
    optionB: "Female"
  },
  {
    id: 2,
    question: "Are you more afraid of being lost in eternal darkness, or being burned by the merciless sun?",
    optionA: "Lost in darkness",
    optionB: "Burned by the sun"
  },
  {
    id: 3,
    question: "How much will you sacrifice for peace?",
    optionA: "Everything I have",
    optionB: "Only what's necessary"
  },
  {
    id: 4,
    question: "When chaos reigns, do you become the storm or seek shelter from it?",
    optionA: "Become the storm",
    optionB: "Seek shelter"
  },
  {
    id: 5,
    question: "Would you rather be feared for your power or loved for your kindness?",
    optionA: "Feared for power",
    optionB: "Loved for kindness"
  },
  {
    id: 6,
    question: "In the face of betrayal, do you seek vengeance or offer forgiveness?",
    optionA: "Seek vengeance",
    optionB: "Offer forgiveness"
  }
];
