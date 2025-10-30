// @ts-check

(function () {
  /**
   * @param {HTMLSelectElement} $select
   */
  function checkIfEmpty($select) {
    if ($select.value === '') {
      $select.classList.add('invalid');
    } else {
      $select.classList.remove('invalid');
    }
  }

  // [select-required]
  document.querySelectorAll('select.required').forEach(($elem) => {
    const $select = /** @type {HTMLSelectElement} */ ($elem);
    checkIfEmpty($select);
    $select.addEventListener('change', () => {
      checkIfEmpty($select);
    });
  });
})();
