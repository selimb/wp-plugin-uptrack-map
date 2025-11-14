(function () {
  'use strict';

  (function() {
    function checkIfEmpty($select) {
      const invalid = $select.value === "";
      $select.classList.toggle("invalid", invalid);
    }
    for (const $elem of document.querySelectorAll("select.required")) {
      const $select = $elem;
      checkIfEmpty($select);
      $select.addEventListener("change", () => {
        checkIfEmpty($select);
      });
    }
  })();

})();
