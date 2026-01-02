(function () {
  const newsData = {
    "tapmood-approval": {
      tag: "App Store Status",
      tagColor: "bg-blue-50 text-blue-600",
      date: "App Review",
      title: "TapMood release is delayed during review.",
      gradient: "bg-gradient-to-r from-blue-50 to-indigo-50",
      body: `
        <p class="mb-4">We have submitted TapMood for App Store review.</p>
        <p class="mb-4">Apple's review is taking longer than expected, so our public release is delayed.</p>
        <p>Thank you for your patience while we complete the approval process.</p>
      `
    },
    "tapmood-delay": {
      tag: "Release Update",
      tagColor: "bg-amber-50 text-amber-700",
      date: "Today",
      title: "TapMood has been delayed.",
      gradient: "bg-gradient-to-r from-amber-50 to-orange-50",
      body: `
        <p class="mb-4">We are sorry for the delay.</p>
        <p class="mb-4">We are working through the remaining App Store steps and will release TapMood as soon as we can.</p>
        <p>Thank you for sticking with us while we finish up.</p>
      `
    },
    "developer-program": {
      tag: "Community",
      tagColor: "bg-emerald-50 text-emerald-600",
      date: "Coming Soon",
      title: "WayV Developer Program Discord is launching shortly.",
      gradient: "bg-gradient-to-r from-emerald-50 to-teal-50",
      body: `
        <p class="mb-4">We are opening the <strong>WayV Developer Program</strong> Discord channel soon.</p>
        <p class="mb-4">This space is for developers of any project, big or small, to ask questions and get answers from our team or other developers in the community.</p>
        <p class="mb-4">We will also support creators building on Roblox, future Wave Engine projects, and other creative initiatives.</p>
        <p>More details will be shared as we get closer to launch.</p>
      `
    },
    tapmood: {
      tag: "Beta 6",
      tagColor: "bg-blue-50 text-blue-600",
      date: "Current Status",
      title: "TapMood readying for release.",
      gradient: "bg-gradient-to-r from-blue-50 to-indigo-50",
      body: `
        <p class="mb-4">We are currently in <strong>Beta 6</strong> of TapMood. This represents a major milestone in our roadmap.</p>
        <p class="mb-4">Most of the application is now feature-complete and ready for release. Our team is currently focusing entirely on:</p>
        <ul class="list-disc pl-5 mb-4 space-y-2">
          <li>Polishing haptic feedback patterns.</li>
          <li>Fixing remaining UI bugs in the journaling flow.</li>
          <li>Ensuring stability across all supported iOS devices.</li>
        </ul>
        <p>Public release will be coming very soon. Stay tuned.</p>
      `
    },
    waveos: {
      tag: "Core Dev",
      tagColor: "bg-purple-50 text-purple-600",
      date: "Current Status",
      title: "WaveOS Kernel & AI Progress.",
      gradient: "bg-gradient-to-r from-purple-50 to-fuchsia-50",
      body: `
        <p class="mb-4">WaveOS is currently very early in development, but we have achieved critical low-level milestones.</p>
        <p class="mb-4"><strong>System Status:</strong></p>
        <ul class="list-disc pl-5 mb-6 space-y-2">
          <li><strong>Bootloader:</strong> Working properly.</li>
          <li><strong>Kernel:</strong> Currently in a basic state, handling minimal resource management.</li>
        </ul>
        <p class="mb-4"><strong>Intelligence:</strong></p>
        <p>We have successfully created a few prototype AI models designed to run locally. These early prototypes are currently handling basic text generation, image processing, and audio synthesis tasks.</p>
      `
    },
    engine: {
      tag: "Engine",
      tagColor: "bg-slate-100 text-slate-600",
      date: "Wavium Interactive",
      title: "Wave Engine enters pre-production.",
      gradient: "bg-gradient-to-r from-slate-100 to-slate-200",
      body: `
        <p class="mb-4">We are very early in the development of <strong>Wave Engine</strong>, our proprietary game engine built for high-fidelity rendering.</p>
        <p>Current work is focused on:</p>
        <ul class="list-disc pl-5 space-y-2">
          <li>Basic architectural prototypes.</li>
          <li>Core loop design sketches.</li>
          <li>Defining the rendering pipeline for future 3D capabilities.</li>
        </ul>
      `
    },
    game: {
      tag: "Game Dev",
      tagColor: "bg-orange-50 text-orange-600",
      date: "Wavium Interactive",
      title: "Project: Shape Shooter.",
      gradient: "bg-gradient-to-r from-orange-50 to-red-50",
      body: `
        <p class="mb-4">We are officially developing our first video game title, currently codenamed <strong>Shape Shooter</strong>.</p>
        <p class="mb-4">The project is in very early development. The team is currently producing:</p>
        <ul class="list-disc pl-5 space-y-2">
          <li>Basic gameplay prototypes to test fun-factor.</li>
          <li>Visual style sketches.</li>
          <li>Input mechanic testing using early versions of Wave Engine tech.</li>
        </ul>
      `
    }
  };

  const initModal = () => {
    const modal = document.getElementById('news-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalTag = document.getElementById('modal-tag');
    const modalDate = document.getElementById('modal-date');
    const modalHeader = document.getElementById('modal-header-bg');

    if (!modal || !modalTitle || !modalBody || !modalTag || !modalDate || !modalHeader) {
      console.error('News modal elements are missing from the page.');
      return;
    }

    const openNews = (id) => {
      const data = newsData[id];
      if (!data) return;

      modalTitle.innerText = data.title;
      modalBody.innerHTML = data.body;
      modalTag.innerText = data.tag;
      modalDate.innerText = data.date;

      modalTag.className = `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${data.tagColor}`;
      modalHeader.className = `h-32 w-full shrink-0 ${data.gradient}`;

      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      updateCountdowns();
    };

    const closeNews = () => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    };

    window.openNews = openNews;
    window.closeNews = closeNews;

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeNews();
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModal);
  } else {
    initModal();
  }
})();
