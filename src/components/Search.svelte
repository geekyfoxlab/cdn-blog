<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { onMount } from "svelte";
import type { SearchResult } from "@/global";

let keywordDesktop = "";
let keywordMobile = "";
let result: SearchResult[] = [];
let isSearching = false;
let initialized = false;
let searchState: SearchState = import.meta.env.DEV ? "development" : "loading";
let activeKeyword = "";
let requestId = 0;

type SearchState = "loading" | "ready" | "development" | "unavailable";

const searchLabel = i18n(I18nKey.search);

const togglePanel = () => {
	const panel = document.getElementById("search-panel");
	panel?.classList.toggle("float-panel-closed");
};

const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
	const panel = document.getElementById("search-panel");
	if (!panel || !isDesktop) return;

	if (show) {
		panel.classList.remove("float-panel-closed");
	} else {
		panel.classList.add("float-panel-closed");
	}
};

const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
	const query = keyword.trim();
	const currentRequestId = ++requestId;
	activeKeyword = query;

	if (!query) {
		setPanelVisibility(false, isDesktop);
		result = [];
		isSearching = false;
		return;
	}

	setPanelVisibility(true, isDesktop);
	result = [];
	if (searchState === "loading") {
		isSearching = true;
		return;
	}
	const pagefind = window.pagefind;
	if (searchState !== "ready" || !pagefind) {
		isSearching = false;
		return;
	}

	isSearching = true;

	try {
		const response = await pagefind.search(query);
		const searchResults = await Promise.all(
			response.results.map((item) => item.data()),
		);
		if (currentRequestId !== requestId) return;
		result = searchResults;
	} catch {
		if (currentRequestId !== requestId) return;
		searchState = "unavailable";
		result = [];
	} finally {
		if (currentRequestId === requestId) {
			isSearching = false;
		}
	}
};

const handleInput = (event: Event, isDesktop: boolean): void => {
	const value = (event.currentTarget as HTMLInputElement).value;
	if (isDesktop) {
		keywordDesktop = value;
	} else {
		keywordMobile = value;
	}
	void search(value, isDesktop);
};

const clearSearch = (): void => {
	requestId += 1;
	keywordDesktop = "";
	keywordMobile = "";
	activeKeyword = "";
	result = [];
	isSearching = false;
	setPanelVisibility(false, true);
};

onMount(() => {
	const initializeSearch = (state: SearchState) => {
		searchState = state;
		initialized = true;
		if (keywordDesktop) void search(keywordDesktop, true);
		if (keywordMobile) void search(keywordMobile, false);
	};

	if (import.meta.env.DEV) {
		initializeSearch("development");
		return;
	}

	const handlePagefindReady = () => initializeSearch("ready");
	const handlePagefindLoadError = () => initializeSearch("unavailable");
	document.addEventListener("pagefindready", handlePagefindReady);
	document.addEventListener("pagefindloaderror", handlePagefindLoadError);
	let timeout: number | undefined;

	if (window.pagefindStatus === "ready" && window.pagefind) {
		initializeSearch("ready");
	} else if (window.pagefindStatus === "error") {
		initializeSearch("unavailable");
	} else {
		// 生成索引缺失或损坏时，避免搜索界面永久停留在加载状态。
		timeout = window.setTimeout(() => {
			if (!initialized) initializeSearch("unavailable");
		}, 8000);
	}

	return () => {
		if (timeout) window.clearTimeout(timeout);
		document.removeEventListener("pagefindready", handlePagefindReady);
		document.removeEventListener("pagefindloaderror", handlePagefindLoadError);
	};
});
</script>

<!-- search bar for desktop view -->
<div id="search-bar" class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
">
    <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
    <input placeholder={searchLabel} aria-label={searchLabel} value={keywordDesktop}
           on:input={(event) => handleInput(event, true)} on:focus={() => { if (keywordDesktop) void search(keywordDesktop, true); }}
           class="transition-all pl-10 text-sm bg-transparent outline-0
         h-full w-40 active:w-60 focus:w-60 text-black/50 dark:text-white/50"
    >
</div>

<!-- toggle btn for phone/tablet view -->
<button on:click={togglePanel} aria-label={`${searchLabel}面板`} id="search-switch"
        class="btn-plain scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90">
    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<!-- search panel -->
<div id="search-panel" class="float-panel float-panel-closed search-panel absolute md:w-[30rem]
top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2">

    <!-- search bar inside panel for phone/tablet -->
    <div id="search-bar-inside" class="flex relative lg:hidden transition-all items-center h-11 rounded-xl
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
  ">
        <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
        <input placeholder={searchLabel} aria-label={searchLabel} value={keywordMobile}
               on:input={(event) => handleInput(event, false)}
               class="pl-10 absolute inset-0 text-sm bg-transparent outline-0
               focus:w-60 text-black/50 dark:text-white/50"
        >
    </div>

    <!-- search results -->
    {#if isSearching}
        <p class="px-3 py-3 text-sm text-50" role="status" aria-live="polite">正在搜索…</p>
    {:else if (keywordDesktop || keywordMobile) && searchState === "development"}
        <p class="px-3 py-3 text-sm text-50" role="status" aria-live="polite">
            开发环境未生成搜索索引，请运行 <code>pnpm build</code> 后使用 <code>pnpm preview</code> 验证真实搜索。
        </p>
    {:else if (keywordDesktop || keywordMobile) && searchState === "unavailable"}
        <p class="px-3 py-3 text-sm text-50" role="status" aria-live="polite">搜索索引暂时不可用，请稍后重试。</p>
    {:else if (keywordDesktop || keywordMobile) && result.length === 0}
        <p class="px-3 py-3 text-sm text-50" role="status" aria-live="polite">
            没有找到与“{activeKeyword}”相关的内容。
        </p>
    {/if}

    {#each result as item}
        <a href={item.url}
           on:click={clearSearch}
           class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
       rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
            <div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
                {item.meta.title}<Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]"></Icon>
            </div>
            <div class="transition text-sm text-50">
                {@html item.excerpt}
            </div>
        </a>
    {/each}
</div>

<style>
  input:focus {
    outline: 0;
  }
  .search-panel {
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  }
</style>
