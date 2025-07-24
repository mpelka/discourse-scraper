export interface Post {
  id: number;
  username: string;
  cooked: string;
  created_at: string;
  post_number: number;
  reply_to_post_number: number | null;
  link_counts?: Array<{
    url: string;
    internal: boolean;
    reflection: boolean;
    title: string;
    clicks: number;
  }>;
}
export interface TopicData {
  title: string;
  slug: string;
  tags: string[];
  post_stream: {
    posts: Post[];
    stream: number[];
  };
}

export interface ConversationTree {
  postMap: Map<number, Post>;
  childrenMap: Map<number, Post[]>;
  topLevelPosts: Post[];
}
