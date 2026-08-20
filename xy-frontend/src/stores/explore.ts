import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { createPlaceCheckIn, createPostComment, getExploreData, markPostUseful, setPlaceWanted, setPostCollection, setPostLike } from "@/services/explore";
import type { Category, Party, Place, Post, PostComment } from "@/types/explore";

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
  const usefulIds = ref<number[]>([]);
  const wantedPlaceIds = ref<number[]>(uni.getStorageSync("xy-wanted-places") || []);
  const comments = ref<PostComment[]>([]);
  const error = ref("");

  const visiblePosts = computed(() => {
    if (selectedCategory.value === "全部") return posts.value;
    const placeIds = places.value
      .filter((p) => p.tags.includes(selectedCategory.value))
      .map((p) => p.id);
    return posts.value.filter((post) => placeIds.includes(post.placeId));
  });

  async function load() {
    loading.value = true;
    error.value = "";
    try {
      const data = await getExploreData();
      city.value = data.city;
      weather.value = data.weather;
      categories.value = data.categories;
      places.value = data.places;
      parties.value = data.parties;
      likedIds.value = uni.getStorageSync("xy-liked-posts") || [];
      collectedIds.value = uni.getStorageSync("xy-collected-posts") || [];
      usefulIds.value = uni.getStorageSync("xy-useful-posts") || [];
      posts.value = data.posts.map((post) => ({
        ...post,
        liked: likedIds.value.includes(post.id),
        collected: collectedIds.value.includes(post.id),
        usefulMarked: usefulIds.value.includes(post.id),
      }));
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "探索内容加载失败";
    } finally {
      loading.value = false;
    }
  }

  async function toggleLike(post: Post) {
    post.liked = !post.liked;
    post.likes = Math.max(0, post.likes + (post.liked ? 1 : -1));
    likedIds.value = post.liked
      ? [...new Set([...likedIds.value, post.id])]
      : likedIds.value.filter((id) => id !== post.id);
    uni.setStorageSync("xy-liked-posts", likedIds.value);
    try { await setPostLike(post.id, Boolean(post.liked)); } catch {
      post.liked = !post.liked;
      post.likes = Math.max(0, post.likes + (post.liked ? 1 : -1));
      likedIds.value = post.liked
        ? [...new Set([...likedIds.value, post.id])]
        : likedIds.value.filter((id) => id !== post.id);
      uni.setStorageSync("xy-liked-posts", likedIds.value);
    }
  }

  async function toggleCollect(post: Post) {
    post.collected = !post.collected;
    collectedIds.value = post.collected
      ? [...new Set([...collectedIds.value, post.id])]
      : collectedIds.value.filter((id) => id !== post.id);
    uni.setStorageSync("xy-collected-posts", collectedIds.value);
    try { await setPostCollection(post.id, Boolean(post.collected)); } catch {
      post.collected = !post.collected;
      collectedIds.value = post.collected
        ? [...new Set([...collectedIds.value, post.id])]
        : collectedIds.value.filter((id) => id !== post.id);
      uni.setStorageSync("xy-collected-posts", collectedIds.value);
    }
  }

  async function toggleUseful(post: Post) {
    if (post.usefulMarked) return;
    post.usefulMarked = true;
    post.useful += 1;
    usefulIds.value = [...new Set([...usefulIds.value, post.id])];
    uni.setStorageSync("xy-useful-posts", usefulIds.value);
    try { await markPostUseful(post.id); } catch {
      post.usefulMarked = false; post.useful = Math.max(0, post.useful - 1);
      usefulIds.value = usefulIds.value.filter(id => id !== post.id);
      uni.setStorageSync("xy-useful-posts", usefulIds.value);
    }
  }

  async function addComment(postId: number, content: string) {
    const comment = await createPostComment(postId, content);
    comments.value.unshift(comment);
    return comment;
  }

  async function toggleWantedPlace(placeId: number) {
    const active = !wantedPlaceIds.value.includes(placeId);
    wantedPlaceIds.value = active ? [...wantedPlaceIds.value, placeId] : wantedPlaceIds.value.filter(id => id !== placeId);
    uni.setStorageSync("xy-wanted-places", wantedPlaceIds.value);
    try { await setPlaceWanted(placeId, active); } catch {
      wantedPlaceIds.value = active ? wantedPlaceIds.value.filter(id => id !== placeId) : [...wantedPlaceIds.value, placeId];
      uni.setStorageSync("xy-wanted-places", wantedPlaceIds.value);
    }
  }

  async function checkIn(placeId: number) { await createPlaceCheckIn(placeId); }

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
    error,
    comments,
    wantedPlaceIds,
    load,
    toggleLike,
    toggleCollect,
    toggleUseful,
    addComment,
    toggleWantedPlace,
    checkIn,
    togglePartyJoin,
  };
});
