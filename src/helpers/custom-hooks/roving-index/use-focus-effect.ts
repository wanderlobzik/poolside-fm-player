import React, { useLayoutEffect } from "react";

// Invokes focus() on ref as a layout effect whenever focused
// changes from false to true.
export default function useFocusEffect(
	focused: boolean | null | undefined,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ref: React.RefObject<any>
): void {
	useLayoutEffect(() => {
		if (focused && ref.current) {
			ref.current.focus();
		}
	}, [ref, focused]);
}
