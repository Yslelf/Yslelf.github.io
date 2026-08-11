import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { getExploreData } from "@/services/explore";
import type { Category, Party, Place, Post } from "@/types/explore";

export const useExploreStore = defineStore("explore", () => {
  const city = ref("南昌");
  const weather = ref("");
  const categories = ref<Category[]>([]);
  const places = ref<Place[]>([]);
  const parties = ref<Party[]>([]);
  const posts = ref<Post[]>([]);
  const selectedCategory = ref("全部");
  const loading = ref(false);
  const likedIds = ref<number[]>([]);
  const collectedIds = ref<number[]>([]);

  const visiblePosts = computed(() => {
    if (selectedCategory.value === "全部") return posts.value;
    const placeIds = places.value
      .filter((p) => p.tags.includes(selectedCategory.value))
      .map((p) => p.id);
    return posts.value.filter((post) => placeIds.includes(post.placeId));
  });

  async function load() {
    loading.value = true;
    try {
      const data = await getExploreData();
      city.value = data.city;
      weather.value = data.weather;
      categories.value = data.categories;
      places.value = data.places;
      parties.value = data.parties;
      likedIds.value = uni.getStorageSync("xy-liked-posts") || [];
      collectedIds.value = uni.getStorageSync("xy-collected-posts") || [];
      posts.value = data.posts.map((post) => ({
        ...post,
        liked: likedIds.value.includes(post.id),
        collected: collectedIds.value.includes(post.id),
      }));
    } finally {
      loading.value = false;
    }
  }

  function toggleLike(post: Post) {
    post.liked = !post.liked;
    post.likes = Math.max(0, post.likes + (post.liked ? 1 : -1));
    likedIds.value = post.liked
      ? [...new Set([...likedIds.value, post.id])]
      : likedIds.value.filter((id) => id !== post.id);
    uni.setStorageSync("xy-liked-posts", likedIds.value);
  }

  function toggleCollect(post: Post) {
    post.collected = !post.collected;
    collectedIds.value = post.collected
      ? [...new Set([...collectedIds.value, post.id])]
      : collectedIds.value.filter((id) => id !== post.id);
    uni.setStorageSync("xy-collected-posts", collectedIds.value);
  }

  function togglePartyJoin(party: Party) {
    party.joined = !party.joined;
    party.members = Math.max(0, party.members + (party.joined ? 1 : -1));
  }

  return {
    city,
    weather,
    categories,
    places,
    parties,
    posts,
    selectedCategory,
    visiblePosts,
    loading,
    load,
    toggleLike,
    toggleCollect,
    togglePartyJoin,
  };
});
