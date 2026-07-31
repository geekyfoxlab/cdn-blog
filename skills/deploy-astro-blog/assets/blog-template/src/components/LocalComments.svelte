<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount } from "svelte";
import { honorOfKingsHeroes } from "@/data/honor-of-kings-heroes";

export let postKey: string;

interface LocalComment {
	id: string;
	authorName: string;
	content: string;
	createdAt: string;
}

interface CommentProfile {
	nickname: string;
}

const profileStorageKey = "cdnBlog.commentProfile.v1";
const commentStoragePrefix = "cdnBlog.comments.v1:";
const fallbackNickname = "访客";

let nickname = fallbackNickname;
let content = "";
let comments: LocalComment[] = [];
let storageAvailable = true;
let submitError = "";

$: normalizedNickname = normalizeNickname(nickname);
$: avatarText = getAvatarText(normalizedNickname);
$: avatarColor = getAvatarColor(normalizedNickname);
$: remainingCharacters = 1000 - content.length;

function getCommentStorageKey(): string {
	return `${commentStoragePrefix}${postKey}`;
}

function normalizeNickname(value: string): string {
	const normalized = value.trim().replace(/\s+/g, " ");
	return normalized || fallbackNickname;
}

function pickRandomNickname(): string {
	if (honorOfKingsHeroes.length === 0) return fallbackNickname;
	const randomValues = new Uint32Array(1);
	crypto.getRandomValues(randomValues);
	return honorOfKingsHeroes[randomValues[0] % honorOfKingsHeroes.length].name;
}

function getAvatarText(value: string): string {
	const chars = Array.from(normalizeNickname(value));
	return chars.slice(-2).join("");
}

function getAvatarColor(value: string): string {
	const chars = Array.from(normalizeNickname(value));
	const hash = chars.reduce(
		(total, char) => (total * 31 + (char.codePointAt(0) ?? 0)) % 360,
		0,
	);
	return `hsl(${hash} 68% 42%)`;
}

function formatTime(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return new Intl.DateTimeFormat("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function createId(): string {
	if (crypto.randomUUID) return crypto.randomUUID();
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readJson<T>(key: string, fallback: T): T {
	try {
		const value = localStorage.getItem(key);
		if (!value) return fallback;
		return JSON.parse(value) as T;
	} catch {
		storageAvailable = false;
		return fallback;
	}
}

function writeJson<T>(key: string, value: T): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
		storageAvailable = true;
	} catch {
		storageAvailable = false;
	}
}

function saveProfile(value: string): void {
	const profile: CommentProfile = {
		nickname: normalizeNickname(value).slice(0, 20),
	};
	writeJson(profileStorageKey, profile);
}

function loadProfile(): void {
	const profile = readJson<CommentProfile | null>(profileStorageKey, null);
	if (profile?.nickname) {
		nickname = profile.nickname;
		return;
	}

	nickname = pickRandomNickname();
	saveProfile(nickname);
}

function loadComments(): void {
	const storedComments = readJson<LocalComment[]>(getCommentStorageKey(), []);
	comments = storedComments.filter(
		(comment) =>
			typeof comment.id === "string" &&
			typeof comment.authorName === "string" &&
			typeof comment.content === "string" &&
			typeof comment.createdAt === "string",
	);
}

function persistComments(nextComments: LocalComment[]): void {
	comments = nextComments;
	writeJson(getCommentStorageKey(), nextComments);
}

function handleNicknameInput(event: Event): void {
	nickname = (event.currentTarget as HTMLInputElement).value.slice(0, 20);
	saveProfile(nickname);
}

function handleContentInput(event: Event): void {
	content = (event.currentTarget as HTMLTextAreaElement).value.slice(0, 1000);
	if (submitError) submitError = "";
}

function submitComment(): void {
	const normalizedContent = content.trim();
	const authorName = normalizeNickname(nickname).slice(0, 20);
	if (!normalizedContent) {
		submitError = "先写一点内容再发布。";
		return;
	}

	saveProfile(authorName);
	persistComments([
		...comments,
		{
			id: createId(),
			authorName,
			content: normalizedContent,
			createdAt: new Date().toISOString(),
		},
	]);
	nickname = authorName;
	content = "";
	submitError = "";
}

function deleteComment(id: string): void {
	persistComments(comments.filter((comment) => comment.id !== id));
}

onMount(() => {
	loadProfile();
	loadComments();
});
</script>

<form class="comment-form" on:submit|preventDefault={submitComment}>
	<div class="profile-row">
		<div
			class="avatar"
			style={`background-color: ${avatarColor}`}
			aria-hidden="true"
		>
			{avatarText}
		</div>
		<label class="name-field">
			<span>昵称</span>
			<input
				value={nickname}
				maxlength="20"
				autocomplete="nickname"
				placeholder={fallbackNickname}
				on:input={handleNicknameInput}
			/>
		</label>
	</div>

	<label class="content-field">
		<span>评论内容</span>
		<textarea
			value={content}
			maxlength="1000"
			rows="4"
			placeholder="写下你的想法"
			on:input={handleContentInput}
		></textarea>
	</label>

	<div class="form-footer">
		<p class="comment-hint" class:warning={!storageAvailable}>
			{#if storageAvailable}
				评论和昵称会保存在当前浏览器。
			{:else}
				当前浏览器无法保存本地评论。
			{/if}
		</p>
		<div class="submit-side">
			<span class="character-count">{remainingCharacters}</span>
			<button class="btn-regular submit-button" type="submit">
				<Icon icon="material-symbols:send-rounded" />
				发布评论
			</button>
		</div>
	</div>

	{#if submitError}
		<p class="form-error" role="alert">{submitError}</p>
	{/if}
</form>

<div class="comment-list" aria-live="polite">
	{#if comments.length === 0}
		<p class="empty-state">还没有评论。</p>
	{:else}
		{#each comments as comment (comment.id)}
			<article class="comment-item">
				<div
					class="avatar"
					style={`background-color: ${getAvatarColor(comment.authorName)}`}
					aria-hidden="true"
				>
					{getAvatarText(comment.authorName)}
				</div>
				<div class="comment-body">
					<div class="comment-meta">
						<div>
							<h3>{comment.authorName}</h3>
							<time datetime={comment.createdAt}>{formatTime(comment.createdAt)}</time>
						</div>
						<button
							class="delete-button"
							type="button"
							aria-label="删除评论"
							title="删除评论"
							on:click={() => deleteComment(comment.id)}
						>
							<Icon icon="material-symbols:delete-outline-rounded" />
						</button>
					</div>
					<p>{comment.content}</p>
				</div>
			</article>
		{/each}
	{/if}
</div>

<style>
	.comment-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.profile-row {
		display: flex;
		align-items: center;
		gap: 0.875rem;
	}

	.avatar {
		display: flex;
		width: 2.75rem;
		height: 2.75rem;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		color: white;
		font-size: 0.875rem;
		font-weight: 700;
		line-height: 1;
	}

	.name-field,
	.content-field {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		width: 100%;
	}

	.name-field span,
	.content-field span {
		color: rgb(0 0 0 / 0.5);
		font-size: 0.875rem;
		font-weight: 700;
	}

	:global(.dark) .name-field span,
	:global(.dark) .content-field span {
		color: rgb(255 255 255 / 0.5);
	}

	input,
	textarea {
		width: 100%;
		border: 1px solid var(--line-divider);
		border-radius: 0.75rem;
		background: rgb(0 0 0 / 0.03);
		color: rgb(0 0 0 / 0.75);
		outline: 0;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	input {
		height: 2.75rem;
		padding: 0 0.875rem;
	}

	textarea {
		min-height: 7.5rem;
		resize: vertical;
		padding: 0.875rem;
		line-height: 1.65;
	}

	input:focus,
	textarea:focus {
		border-color: var(--primary);
		background: rgb(0 0 0 / 0.045);
	}

	:global(.dark) input,
	:global(.dark) textarea {
		background: rgb(255 255 255 / 0.055);
		color: rgb(255 255 255 / 0.78);
	}

	:global(.dark) input:focus,
	:global(.dark) textarea:focus {
		background: rgb(255 255 255 / 0.08);
	}

	.form-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.comment-hint,
	.character-count,
	.empty-state,
	.form-error {
		margin: 0;
		font-size: 0.875rem;
	}

	.comment-hint,
	.character-count,
	.empty-state {
		color: rgb(0 0 0 / 0.5);
	}

	:global(.dark) .comment-hint,
	:global(.dark) .character-count,
	:global(.dark) .empty-state {
		color: rgb(255 255 255 / 0.5);
	}

	.comment-hint.warning,
	.form-error {
		color: rgb(220 38 38);
	}

	.submit-side {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		gap: 0.75rem;
	}

	.submit-button {
		min-height: 2.75rem;
		gap: 0.4rem;
		border-radius: 0.75rem;
		padding: 0 1rem;
		font-weight: 700;
	}

	.submit-button :global(svg) {
		width: 1.15rem;
		height: 1.15rem;
	}

	.comment-list {
		display: flex;
		flex-direction: column;
		gap: 1.15rem;
		margin-top: 1.5rem;
	}

	.comment-item {
		display: flex;
		gap: 0.875rem;
		border-top: 1px dashed var(--line-divider);
		padding-top: 1.15rem;
	}

	.comment-body {
		min-width: 0;
		flex: 1;
	}

	.comment-meta {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.comment-meta h3 {
		margin: 0;
		color: rgb(0 0 0 / 0.86);
		font-size: 0.95rem;
		font-weight: 800;
	}

	.comment-meta time {
		display: block;
		margin-top: 0.15rem;
		color: rgb(0 0 0 / 0.42);
		font-size: 0.8rem;
	}

	:global(.dark) .comment-meta h3 {
		color: rgb(255 255 255 / 0.86);
	}

	:global(.dark) .comment-meta time {
		color: rgb(255 255 255 / 0.42);
	}

	.comment-body p {
		margin: 0;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		color: rgb(0 0 0 / 0.72);
		line-height: 1.75;
	}

	:global(.dark) .comment-body p {
		color: rgb(255 255 255 / 0.72);
	}

	.delete-button {
		display: flex;
		width: 2rem;
		height: 2rem;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		border-radius: 0.625rem;
		color: rgb(0 0 0 / 0.35);
		transition:
			background-color 0.2s ease,
			color 0.2s ease;
	}

	.delete-button:hover {
		background: var(--btn-plain-bg-hover);
		color: rgb(220 38 38);
	}

	:global(.dark) .delete-button {
		color: rgb(255 255 255 / 0.35);
	}

	.delete-button :global(svg) {
		width: 1.2rem;
		height: 1.2rem;
	}

	@media (max-width: 640px) {
		.form-footer {
			align-items: stretch;
			flex-direction: column;
		}

		.submit-side {
			justify-content: space-between;
		}
	}
</style>
