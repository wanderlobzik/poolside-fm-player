import { useRef, useLayoutEffect, useCallback, useContext, RefObject, KeyboardEvent } from "react";
import { uniqueId } from "helpers/unique-id";
import { KEY_CODES } from "helpers/key-codes";
import { RovingTabIndexContext } from "./roving-provider";
import { EKeyDirection, ActionTypes } from "./types.d";

enum TabDirection {
	Next,
	Previous,
}

// domElementRef:
//   - a React DOM element ref of the DOM element that is the focus target
//   - this must be the same DOM element for the lifecycle of the component
// disabled:
//   - can be updated as appropriate to reflect the current enabled or disabled
//     state of the component
// id:
//   - an optional ID that is the unique ID for the component
//   - if provided then it must be a non-empty string
//   - if not provided then one will be autogenerated
// The returned callbacks handleOnKeyPress and handleClick are stable.
export default function useRovingTabIndex<T>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	domElementRef: RefObject<T | any>,
	disabled: boolean,
	id?: string
): [
	number,
	boolean,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(event: KeyboardEvent<T | any>) => void,
	() => void
] {
	// This id is stable for the life of the component:
	const tabIndexId = useRef(id || uniqueId("roving-tabindex_"));
	const { state, dispatch } = useContext(RovingTabIndexContext);

	// Registering and unregistering are tied to whether the input is disabled or not.
	// Context is not in the inputs because dispatch is stable.
	useLayoutEffect(() => {
		if (disabled) {
			return;
		}

		const id = tabIndexId.current;

		dispatch({
			type: ActionTypes.REGISTER,
			payload: { id, domElementRef },
		});
		return (): void => {
			dispatch({
				type: ActionTypes.UNREGISTER,
				payload: { id },
			});
		};
	}, [disabled]);

	const getDirection = (
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		event: KeyboardEvent<T | any>
	): TabDirection | null => {
		if (state.direction === EKeyDirection.HORIZONTAL || state.direction === EKeyDirection.BOTH) {
			if (event.keyCode === KEY_CODES.ARROW_LEFT) {
				return TabDirection.Previous;
			}
			if (event.keyCode === KEY_CODES.ARROW_RIGHT) {
				return TabDirection.Next;
			}
		}
		if (state.direction === EKeyDirection.VERTICAL || state.direction === EKeyDirection.BOTH) {
			if (event.keyCode === KEY_CODES.ARROW_UP) {
				return TabDirection.Previous;
			}
			if (event.keyCode === KEY_CODES.ARROW_DOWN) {
				return TabDirection.Next;
			}
		}
		return null;
	};

	const handleOnKeyPress = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(event: KeyboardEvent<T | any>) => {
			const payload = { id: tabIndexId.current };
			const direction = getDirection(event);
			if (direction === TabDirection.Previous) {
				dispatch({
					type: ActionTypes.TAB_TO_PREVIOUS,
					payload,
				});
				event.preventDefault();
			} else if (direction === TabDirection.Next) {
				dispatch({
					type: ActionTypes.TAB_TO_NEXT,
					payload,
				});
				event.preventDefault();
			} else if (event.keyCode === KEY_CODES.HOME) {
				dispatch({ type: ActionTypes.TAB_TO_FIRST });
				event.preventDefault();
			} else if (event.keyCode === KEY_CODES.END) {
				dispatch({ type: ActionTypes.TAB_TO_LAST });
				event.preventDefault();
			}
		},
		[state]
	);

	const handleClick = useCallback(() => {
		dispatch({
			type: ActionTypes.CLICKED,
			payload: { id: tabIndexId.current },
		});
	}, []);

	const selected = !disabled && tabIndexId.current === state.selectedId;
	const tabIndex = selected ? 0 : -1;
	const focused = selected && state.lastActionOrigin !== null;
	return [tabIndex, focused, handleOnKeyPress, handleClick];
}
