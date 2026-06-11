const filterButtons = document.querySelectorAll(".filter-btn");
const workCards = document.querySelectorAll(".work-card");

const previousTabs = document.querySelectorAll(".previous-tab");
const previousCards = document.querySelectorAll(".previous-card");

const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter;

    filterButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    workCards.forEach((card) => {
      const categories = card.dataset.category
        ? card.dataset.category.split(" ")
        : [];

      const shouldShow =
        selectedFilter === "all" || categories.includes(selectedFilter);

      card.hidden = !shouldShow;
    });
  });
});

previousTabs.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.previousFilter;

    previousTabs.forEach((tab) => {
      tab.classList.remove("active");
    });

    button.classList.add("active");

    previousCards.forEach((card) => {
      const categories = card.dataset.previousType
        ? card.dataset.previousType.split(" ")
        : [];

      const shouldShow =
        selectedFilter === "all" || categories.includes(selectedFilter);

      card.hidden = !shouldShow;
    });
  });
});