// Progressive enhancement for the capacity timeline in the engineering
// decisions section.
//
// Everything the section demonstrates already works without this file: the
// timeline is a radio group, and the frames are swapped in CSS. All this adds
// is a play control that walks the steps once, for a reader who would rather
// watch the sequence than click through it. The button is created here rather
// than in the markup so no dead control appears when scripting is off.
(function () {
    'use strict';

    var group = document.querySelector('.dc-cap .dc-track');
    if (!group) return;

    var steps = Array.prototype.slice.call(
        group.querySelectorAll('input[name="dc-step"]')
    );
    if (steps.length < 2) return;

    // Long enough to read each caption, short enough to sit through.
    var DWELL_MS = 2200;
    var timer = null;

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'dc-play';
    button.textContent = 'Play the sequence';

    function stop(label) {
        window.clearTimeout(timer);
        timer = null;
        button.textContent = label;
    }

    function advance(index) {
        steps[index].checked = true;
        // Fire input so anything else listening to the group stays in step.
        steps[index].dispatchEvent(new Event('input', { bubbles: true }));
        if (index === steps.length - 1) {
            stop('Play again');
            return;
        }
        timer = window.setTimeout(function () {
            advance(index + 1);
        }, DWELL_MS);
    }

    button.addEventListener('click', function () {
        if (timer) {
            stop('Play the sequence');
            return;
        }
        button.textContent = 'Stop';
        advance(0);
    });

    // A reader who takes the control back should not be fighting the timer.
    steps.forEach(function (input) {
        input.addEventListener('change', function () {
            if (timer) stop('Play the sequence');
        });
    });

    group.parentNode.insertBefore(button, group.nextSibling);
})();
