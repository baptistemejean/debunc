export interface Video {
  src: string;
  thumbnail: string;
  alt: string;
}

export interface Post {
  name: string;
  handle: string;
  text: string;
  images: string[];
  videos: Video[];
  id: string;
}

export interface Claim {
  claim: string;
  summary: string;
  fakeness_score: number;
  sources: any[];
}
