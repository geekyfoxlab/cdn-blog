<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import {
	colorFromHue,
	getDefaultHue,
	getDefaultThemeColor,
	getHue,
	getThemeColor,
	hueFromHex,
	resetThemeColor,
	setHue,
	setThemeColor,
	toColorInputValue,
} from "@utils/setting-utils";

let hue = getHue();
const defaultHue = getDefaultHue();
const defaultThemeColor = toColorInputValue(
	getDefaultThemeColor() || colorFromHue(defaultHue),
);
let themeColor = toColorInputValue(getThemeColor() || colorFromHue(hue));

function applyHue(nextHue: number) {
	hue = nextHue;
	themeColor = colorFromHue(hue);
	setHue(hue);
	setThemeColor(themeColor);
}

function updateHue(event: Event) {
	const target = event.currentTarget as HTMLInputElement;
	applyHue(Number(target.value));
}

function updateThemeColor(event: Event) {
	const target = event.currentTarget as HTMLInputElement;
	themeColor = target.value;
	const nextHue = hueFromHex(themeColor);
	if (nextHue !== null) {
		hue = nextHue;
		setHue(hue);
	}
	setThemeColor(themeColor);
}

function resetHue() {
	hue = defaultHue;
	themeColor = defaultThemeColor;
	resetThemeColor();
	document.documentElement.style.setProperty("--hue", String(hue));
}
</script>

<div id="display-setting" class="float-panel float-panel-closed absolute z-[70] transition-all w-80 right-4 px-4 py-4">
    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.33rem]"
        >
            {i18n(I18nKey.themeColor)}
            <button aria-label="Reset to Default" class="btn-regular w-7 h-7 rounded-md  active:scale-90 will-change-transform"
                    class:opacity-0={hue === defaultHue && themeColor === defaultThemeColor} class:pointer-events-none={hue === defaultHue && themeColor === defaultThemeColor} on:click={resetHue}>
                <div class="text-[var(--btn-content)]">
                    <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]"></Icon>
                </div>
            </button>
        </div>
        <div class="flex gap-1">
            <div id="hueValue" class="transition bg-[var(--btn-regular-bg)] w-10 h-7 rounded-md flex justify-center
            font-bold text-sm items-center text-[var(--btn-content)]">
                {hue}
            </div>
            <label aria-label={i18n(I18nKey.themeColor)} class="color-picker transition bg-[var(--btn-regular-bg)] w-10 h-7 rounded-md flex items-center justify-center">
                <input type="color" bind:value={themeColor} on:input={updateThemeColor} />
            </label>
        </div>
    </div>
    <div class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded select-none">
        <input aria-label={i18n(I18nKey.themeColor)} type="range" min="0" max="360" bind:value={hue} on:input={updateHue}
               class="slider" id="colorSlider" step="5" style="width: 100%">
    </div>
</div>


<style lang="stylus">
    #display-setting
      input[type="range"]
        -webkit-appearance none
        height 1.5rem
        background-image var(--color-selection-bar)
        transition background-image 0.15s ease-in-out

        /* Input Thumb */
        &::-webkit-slider-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-moz-range-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          border-width 0
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-ms-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

      .color-picker
        cursor pointer
        overflow hidden

        input[type="color"]
          -webkit-appearance none
          appearance none
          width 100%
          height 100%
          padding 0
          border 0
          background transparent
          cursor pointer

          &::-webkit-color-swatch-wrapper
            padding 0

          &::-webkit-color-swatch
            border 0
            border-radius 0.375rem

          &::-moz-color-swatch
            border 0
            border-radius 0.375rem

</style>
