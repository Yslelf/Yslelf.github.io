export interface Category {
  id: number;
  name: string;
  icon: string;
}
export interface Place {
  id: number;
  name: string;
  subtitle: string;
  category: string;
  distance: string;
  score: number;
  image: string;
  tags: string[];
  longitude: number;
  latitude: number;
}
export interface Post {
  id: number;
  placeId: number;
  title: string;
  excerpt: string;
  author: string;
  avatar: string;
  cover: string;
  likes: number;
  useful: number;
  checkedIn: boolean;
  live: boolean;
  liked?: boolean;
  collected?: boolean;
}
export interface Party {
  id: number;
  title: string;
  category: string;
  date: string;
  place: string;
  distance: string;
  members: number;
  capacity: number;
  host: string;
  avatar: string;
  cover: string;
  tags: string[];
  joined: boolean;
}
export interface ExploreData {
  city: string;
  weather: string;
  categories: Category[];
  places: Place[];
  parties: Party[];
  posts: Post[];
}
