# Implementation Plan: Premium Dark Tech Transformation for Download Page

## Goal
Transform `src/app/download/page.tsx` from a basic dark page to a 'premium dark tech' aesthetic with high-conversion (CRO) elements.

## 1. Visual Theme & Background
### Background Architecture
- **Base Layer**: `bg-[#020617]` (Slate-950) for the main container.
- **Ambient Layer**: 
  - Use `public/images/blue-bg.png` as an absolute positioned background.
  - Classes: `absolute inset-0 opacity-30 mix-blend-screen pointer-events-none`.
- **Pattern Layer**: 
  - Implement a subtle circuit board pattern using a CSS background image or a small inline SVG repeated.
  - Style: `opacity-10` and `mix-blend-overlay`.
- **Typography**: Ensure `var(--font-jakarta)` is applied (default for the project).

## 2. Layout Restructuring
### Content Distribution
- **Main Container**: Transition from `max-w-xl` centered to a more dynamic layout.
- **Top-Right Pricing Block**:
  - Container: `flex flex-col items-end text-right`.
  - **Anchor Pricing**: 
    - Original Price: `text-zinc-500 line-through text-sm mr-2`.
    - Current Price: `text-3xl font-bold text-white`.
  - **Badge**: `bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`.
- **CTA Button**:
  - Color: `bg-[#0284C7]` (Premium Blue).
  - Styles: `text-white font-bold px-8 py-4 rounded-full transition-all hover:bg-[#0369A1] shadow-[0_0_20px_rgba(2,132,199,0.4)]`.
- **Footer**:
  - Reseller info moved to `absolute bottom-8 left-1/2 -translate-x-1/2 text-center`.
  - Style: `text-zinc-500 text-xs`.

## 3. Urgency Timer
### Logic
- **Persistence**: Use `localStorage` to store the `expiryTime`.
- **Workflow**: 
  1. Check `localStorage` for `download_expiry`.
  2. If not exists or expired, set `expiryTime = now + 10 minutes`.
  3. Use `setInterval` to calculate `remainingTime`.
- **UI**:
  - Label: `text-zinc-400 text-[10px] uppercase tracking-[0.2em] mb-1`.
  - Timer: `font-mono text-cyan-400 text-2xl font-bold`.

## 4. Social Proof Ticker
### Logic
- **Data Pool**:
  - `NAMES`: ["Arjun", "Priya", "Rahul", "Ananya", "Vikram", "Sanya", "Ishaan", "Kavya", "Aditya", "Meera"].
  - `CITIES`: ["Mumbai", "Bangalore", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Surat", "Jaipur"].
- **Cycle**: 
  - Change message every 8-10 seconds.
  - Use Framer Motion's `AnimatePresence` for a smooth "slide-up" or "fade" transition.
- **UI**:
  - Position: `fixed bottom-0 left-0 w-full`.
  - Styles: `bg-blue-900/30 backdrop-blur-md border-t border-blue-500/20 text-blue-200 text-[11px] py-2 text-center`.

## 5. Technical Implementation Steps
1. **Asset Prep**: Verify `blue-bg.png` and define the circuit SVG pattern.
2. **Base Layout**: Update `main` and wrap content in a relative container.
3. **Pricing/CTA**: Replace the current `h1` and `button` with the anchor pricing and premium blue CTA.
4. **Timer Component**: Implement the `Timer` component with `localStorage` logic.
5. **Ticker Component**: Implement the `SocialProofTicker` with the Indian names/cities pool.
6. **Footer Update**: Relocate the reseller info.
7. **Integration**: Preserve existing Razorpay `buy` function and `unlocked` state logic.

## Critical Files for Implementation
- `src/app/download/page.tsx`
EOF`
