(function () {
  function checkIfEmpty($select: HTMLSelectElement): void {
    const invalid = $select.value === "";
    $select.classList.toggle("invalid", invalid);
  }

  // [select-required]
  for (const $elem of document.querySelectorAll("select.required")) {
    // SAFETY: The selector ensures this is a select element.
    const $select = $elem as HTMLSelectElement;
    checkIfEmpty($select);
    $select.addEventListener("change", () => {
      checkIfEmpty($select);
    });
  }
})();
