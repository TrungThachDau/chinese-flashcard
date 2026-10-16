export interface LifeQuestion {
  id: number;
  topic: string;
  topic_name: string;
  situation: string;
  question_hanzi: string;
  question_pinyin: string;
  question_meaning: string;
  answer_hanzi: string;
  answer_pinyin: string;
  answer_meaning: string;
  options: string[]; // Options for interactive quiz
  explanation: string;
  completed: boolean;
  last_practiced: string | null;
}

