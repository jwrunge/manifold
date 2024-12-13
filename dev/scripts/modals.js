const trigger_registry = /** @type {WeakSet<Element>} **/ new WeakSet();
const dialog_registry =
	/** @type {WeakSet<HTMLDialogElement>} **/ new WeakSet();

/**
 * @param {HTMLDialogElement | null} dialog
 * @returns {void}
 */
function closeModal(dialog) {
	dialog?.close();
}

/**
 * @param {Event} event
 * @param {HTMLDialogElement | null} dialog
 * @returns {void}
 */
function backdropDismiss(event, dialog) {
	event.target === dialog && dialog?.close();
}

export function registerModals(trigger_class = "modal-trigger") {
	const modal_triggers = document.querySelectorAll(`.${trigger_class}`);
	for (const trigger of modal_triggers) {
		if (trigger_registry.has(trigger)) {
			continue;
		}
		trigger_registry.add(trigger);

		const modal_id = trigger.getAttribute("href") ?? "";
		const modal = /** @type {HTMLDialogElement} */ (
			document.querySelector(modal_id)
		);

		if (!dialog_registry.has(modal)) {
			dialog_registry.add(modal);

			modal.addEventListener("click", (e) => {
				backdropDismiss(e, modal);
			});

			modal
				.querySelector("header .closer")
				?.addEventListener("click", (e) => {
					closeModal(modal);
				});
		}

		trigger.addEventListener("click", (e) => {
			e.preventDefault();
			modal?.showModal();
		});
	}
}
