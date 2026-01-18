const LANG_TEXTS = {
    en: {
        sidebar: {
            clicks: "Clicks:",
            start: "Start Page:",
            target: "Target Page:",
        },
        winModal: {
            title: "You Win!",
            message: "Congratulations, you reached the target page!"
        }
    },
    fi: {
        sidebar: {
            clicks: "Klikit:",
            start: "Alku:",
            target: "Kohde:",
        },
        winModal: {
            title: "Voitit!",
            message: "Onneksi olkoon, saavutit kohdesivun!"
        }
    },
    de: {
        sidebar: {
            clicks: "Klicks:",
            start: "Startseite:",
            target: "Zielseite:",
        },
        winModal: {
            title: "Du hast gewonnen!",
            message: "Herzlichen Glückwunsch, du hast die Zielseite erreicht!"
        }
    },
    sv: {
        sidebar: {
            clicks: "Klick:",
            start: "Start:",
            target: "Mål:",
        },
        winModal: {
            title: "Du vann!",
            message: "Grattis, du nådde målsidan!"
        }
    }
};

function getLangTexts() {
    return LANG_TEXTS[WIKI_LANG] || LANG_TEXTS["en"];
}

function updateSidebar() {
    const texts = getLangTexts();

    document.getElementById("click-counter-label").textContent = texts.sidebar.clicks;
    document.getElementById("start-page-label").textContent = texts.sidebar.start;
    document.getElementById("target-page-label").textContent = texts.sidebar.target;
}