# Źródła i nauka z donorów

13.10.2026 · wybrane źródła projektów · odczyt kodu, bez nowej kwalifikacji gry

Donory dostarczają konkretnych podkompetencji i doświadczeń. Przenoszony mechanizm otrzymuje nową ocenę w kontekście Krainy. Poniższe piny nie są deklaracją najnowszego zdalnego HEAD, wdrożenia lub Owner PASS MiniFeniksa.

## Character i chwyt 3D

[Box3d-Character-Controler — pin e7a98be](https://github.com/Jozzpoly/Box3d-Character-Controler/tree/e7a98beaca4c010e056c31db97b33c05b4610e38)

- [src/donor/index.js](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/src/donor/index.js): factory V1 i cykl `preStep → world step → postStep`.
- [src/character.js](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/src/character.js): analityczna kapsuła, stan własny i ręczna reakcja kontaktu; konstruktor nie rejestruje native body/shape mieszkańca.
- [src/e19/dual-grip-actuator.js](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/src/e19/dual-grip-actuator.js) i [dual-grip-relative-kernel.js](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/src/e19/dual-grip-relative-kernel.js): operator chwytu, bezwładność trzymanej rzeczy i przeciwna zmiana prędkości punktowej masy nosiciela. Domyślne limity są nieskończone.
- [package.json](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/package.json): wiązanie `box3d.js` 0.1.1.
- [src/solver-owned-character.js](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/src/solver-owned-character.js) i [scripts/e2-1-localization.mjs](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/scripts/e2-1-localization.mjs): wcześniejsza native kapsuła 1,80 m, 80 kg, z blokadą obrotu i ograniczonym napędem poziomym; rzeczywista konstrukcja próby stopni. [Historyczny zapis E2](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/docs/E2_1_LOCALIZATION.md) opisuje blokowanie stopni i próby większego napędu. Nie wykonano teraz testów; wynik nie obala wszystkich modeli native mieszkańca.

Przydatne: źródło zachowania lokomocji, zapytań podparcia, matematyki i wcześniejszych falsyfikatorów. Granica: wiele zwykłych V1 nie ustanawia kontaktu wielu osób; E19 nie kwalifikuje chwytu dwóch native ciał, naszego chodu, schodów, postur lub żywego odczytu. Decyzja native-first w `FOUNDATION.md` jest nowym rozwiązaniem do sprawdzenia.

Ponowny odczyt: [constraint-velocity-character.js](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/src/constraint-velocity-character.js) ogranicza pozostałą prędkość względem aktywnej przeszkody, zachowując kierunek styczny. Wykonano oryginalny [donor-v1-smoke.mjs](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/scripts/donor-v1-smoke.mjs) z Box3D 0.1.1: exit 0, przesunięcie po zwolnieniu blokowanego ruchu V1 **0.000 m**, starszy wariant kontrolny **1.282 m**, błąd odtworzenia solvera **6.06e-9**. Skrypt i kod donora pozostały niezmienione; podłączono zainstalowane wiązanie. To wąski wynik mechaniczny, bez nowego Owner free play i porównania odczucia z MiniFeniksem. [DONOR_CONTRACT.md](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/docs/DONOR_CONTRACT.md) wskazuje wcześniejszą akceptację Owner próbki `bc06ca9`. Odzyskujemy jakość zachowania; nie wybieramy automatycznie analitycznego ciała ani wszystkich dawnych stałych.

## Autorstwo — relacje i przyjęcie gestu

| Donor / pin | Rzeczywisty mechanizm | Granica transferu |
| --- | --- | --- |
| [HomeScan, f2c3693](https://github.com/Jozzpoly/HomeScan-Web-Builder/tree/f2c36937062ae431d58d05955c2bc0978c179a13) — repo dostępne właścicielowi | `packages/editor/src/transform-session.ts` i `apps/web/src/building-gizmo.ts`: podgląd, walidacja, anulowanie; App przyjmuje jeden nazwany command i pomija pusty ruch. Otwór ma gospodarza `wallId`, split remapuje otwory, placement przenosi kompozycję. | Walidacja samego gestu placement sprawdza skończone liczby, nie zajęcie przez żywego człowieka. Odbudowa obrazu i historia dokumentu nie kwalifikują ciągłości mieszkańców. |
| [JURE, d971b8b](https://github.com/Jozzpoly/Jozz-Universal-Rig-Editor/tree/d971b8bef5dd7c65b78884b6b449e1f5ab0e7425) | `src/editor/transform-target.ts` przelicza world pose do lokalnego układu gospodarza; `src/editor/session.ts` rozdziela preview/commit/cancel. Przesunięcie elementu zachowuje lokalne ramy. | `role` ramy jest metadanymi; nie ustanawia siadu, podparcia ani działania. To nie gotowa hierarchia domu i wyposażenia. |
| [ANVIL, 29c83ea](https://github.com/Jozzpoly/PROJECT-ANVIL-Machine-Matter-Physical-Fabric-Laboratory/tree/29c83ea3256a15923a7db648f2b03c7481223b42) — ścieżka badawcza poza `main` | `src/studio-recovery/source.ts`: tworzenie, ekstrudowanie, usuwanie i naprawa zależnych odwołań z historią autora. Nierozwiązana intencja może pozostać po usunięciu formy. | Dialekt komórek i mechanika maszyn nie przesądzają form krainy. `src/studio-r2/app.ts` po Stop/Run tworzy świeży runtime; nie jest donorem żywego cofania lub zapisu historii świata. |

To referencje dla przebudowy prymitywnego autorstwa MiniFeniksa. Dawne wykonane próby podkompetencji zachowują własny zakres; teraz odczytano kod, bez nowego testu użytkowego lub próby edycji zamieszkanego świata. Wartościowa transakcja dokumentu nie oznacza zgody na cofanie przeżytych skutków.

## Llm-Live-NPC — czynność, przerwanie i następna sprawa

[Pin 555e64c](https://github.com/Jozzpoly/Llm-Live-NPC/tree/555e64cf5e3f0cf2bf087361eef21298b2e11bdc) pochodzi z rozwijanej ścieżki badawczej; nie utożsamiamy go ze starszym domyślnym `main` ani gotową kompetencją MiniFeniksa.

- [resident-causal-execution-coordinator.ts](https://github.com/Jozzpoly/Llm-Live-NPC/blob/555e64cf5e3f0cf2bf087361eef21298b2e11bdc/src/spc-next/resident-causal-execution-coordinator.ts): jedna sprawa i wykonanie obejmują dojście, podjęcie, niesienie i odłożenie. Sam pickup nie kończy zobowiązania dostarczenia tej rzeczy.
- [spc-world-runtime.ts](https://github.com/Jozzpoly/Llm-Live-NPC/blob/555e64cf5e3f0cf2bf087361eef21298b2e11bdc/src/spc-next/spc-world-runtime.ts): gracz i uprawnione wykonanie mieszkańca korzystają ze wspólnego materialnego rozstrzygnięcia; położenie, widoczność i posiadanie pochodzą ze świata.
- [five-resident-ordinary-player-contact.integration.test.ts](https://github.com/Jozzpoly/Llm-Live-NPC/blob/555e64cf5e3f0cf2bf087361eef21298b2e11bdc/src/spc-next/five-resident-ordinary-player-contact.integration.test.ts): sprawdzana jest przerwa w niesieniu, zachowanie powiązania i późniejsze rzeczywiste odłożenie tej samej skrzyni. Krótkie „Tak?” nie ustanawia zrozumienia lub zgody.
- [five-resident-unified-living-runtime.integration.test.ts](https://github.com/Jozzpoly/Llm-Live-NPC/blob/555e64cf5e3f0cf2bf087361eef21298b2e11bdc/src/spc-next/five-resident-unified-living-runtime.integration.test.ts): wynik działania może uruchomić nową sprawę opartą na prywatnie poznanej rzeczy; nieznana rzecz jest odrzucana. W tej próbie odpowiedź jest podstawiona przez `fetcher`, a poznanie wywołane ręcznie.

W tym runie odczytano ścieżki i asercje; nie uruchomiono nowych testów ani usług modeli. Donor daje silniejszą granicę próby/postępu/przerwania/wyniku, nie fizyczny chwyt 3D: jego materialne posiadanie jest modelem 2D. Przygotowane obowiązki i pojedynczy nowy wybór nie dowodzą podtrzymującego się życia. Transfer wymaga połączenia z rzeczywistym ciałem, obserwacją, trwającymi możliwościami i zapisem krainy.

## Wiązanie i rzeczywisty cykl native geometrii

[box3d.js — pin 5d5a3af](https://github.com/isaac-mason/box3d.js/tree/5d5a3af049cccd9948b2b55bac4342414af0ef64) deklaruje wersję 0.1.1. Jego gitlink `vendor/box3d` wskazuje [native Box3D — pin 8441b4a](https://github.com/erincatto/box3d/tree/8441b4a06d6d09dcfb0b0f704df4d847d1437b92). Sprawdzono kod wiązania i silnika, nie tylko wywołania w donorze.

- [src/bindings.cpp](https://github.com/isaac-mason/box3d.js/blob/5d5a3af049cccd9948b2b55bac4342414af0ef64/src/bindings.cpp) eksportuje `SetCapsule`, tworzenie hull/mesh i usuwanie kształtu. Nie eksportuje `SetHull`/`SetMesh`; lokalna rewizja może wymieniać kształty na zachowanym ciele.
- [src/shape.c](https://github.com/erincatto/box3d/blob/8441b4a06d6d09dcfb0b0f704df4d847d1437b92/src/shape.c): `SetCapsule` wywołuje `b3ResetProxy`, który usuwa kontakty tego kształtu. Samo dostępne API mutacji nie kwalifikuje ciągłej postury.
- [src/body.c](https://github.com/erincatto/box3d/blob/8441b4a06d6d09dcfb0b0f704df4d847d1437b92/src/body.c): zniszczenie ciała usuwa przyłączone joints; przeliczenie masy z kształtów koryguje prędkość przy zmianie środka masy. `SetMassData` aktualizuje lokalną bezwładność, a `SetTransform` odświeża jej cache światowy. Odtworzenie prędkości przed finalizacją geometrii/masy może zafałszować checkpoint bez wykonania kroku.
- [src/contact.c](https://github.com/erincatto/box3d/blob/8441b4a06d6d09dcfb0b0f704df4d847d1437b92/src/contact.c) i [src/physics_world.c](https://github.com/erincatto/box3d/blob/8441b4a06d6d09dcfb0b0f704df4d847d1437b92/src/physics_world.c): usuwanie kontaktu może zakolejkować `end-touch`, odebrany po kolejnym kroku. Techniczne wycofanie reprezentacji nie jest automatycznie świadectwem działania osoby.

To podstawa kolejności wykonania i konkretnych sprawdzeń podczas budowy. Nie uruchomiono nowej postury, wymiany geometrii lub odczytu MiniFeniksa.

## JV — reprezentacje, zasoby i czas

[JV-Box3D-Web-experiment — pin 5c3830c](https://github.com/Jozzpoly/JV-Box3D-Web-experiment/tree/5c3830c01d58e42fb9b3705ff9948bdbe6071659)

- [src/scene/jv-world-physics.ts](https://github.com/Jozzpoly/JV-Box3D-Web-experiment/blob/5c3830c01d58e42fb9b3705ff9948bdbe6071659/src/scene/jv-world-physics.ts): statyczna instalacja brył/meshy i właściciel zasobów. Meshe używają `Float32Array`; nie wynika stąd kwalifikacja precyzji całego przyszłego regionu. Zwolnienie po zniszczeniu świata nie kwalifikuje lokalnej żywej wymiany.
- [src/core/fixed-step-clock.ts](https://github.com/Jozzpoly/JV-Box3D-Web-experiment/blob/5c3830c01d58e42fb9b3705ff9948bdbe6071659/src/core/fixed-step-clock.ts): clamp/drop może przesunąć `simulationTimeMs` bez wykonania `onStep`. Nie dziedziczymy tej semantyki jako pauzy życia.
- [package.json](https://github.com/Jozzpoly/JV-Box3D-Web-experiment/blob/5c3830c01d58e42fb9b3705ff9948bdbe6071659/package.json): donor JV używa wiązania 0.0.2. Jego instalatora nie traktujemy jako gotowego adaptera wybranego 0.1.1.

Przydatne są ograniczone wzory własności i oddzielenia reprezentacji. Installer nie dostarcza kontraktu rewizji, zapisu i prywatnej ciągłości mieszkańców.

## ReflexBrain — obserwacja musi prowadzić wybór

[Living A — pin cb03fcd](https://github.com/Jozzpoly/ReflexBrain-Lab/tree/cb03fcd1ca668baac36e87e90252514ba40179af), [src/living-organism/runtime.ts](https://github.com/Jozzpoly/ReflexBrain-Lab/blob/cb03fcd1ca668baac36e87e90252514ba40179af/src/living-organism/runtime.ts).

W tej ścieżce wykonywane jest `vision.observe(frame)`, ale `occupant.decide(frame)` nie otrzymuje wyniku estymacji PrivateVision. To wąska granica konkretnego snapshotu; nie oznacza, że cała pamięć Occupant jest nieczynna. Instrumentacja albo wynik probe nie dowodzi wpływu na działającego mieszkańca. Nowe uczenie lub poznawanie musi rzeczywiście zmieniać właściwy wybór/wykonanie i przejść próbę swojego zakresu.

## Naturalność i własne kształtowanie

[Génevaux i współautorzy, 2013 — opis autora](https://perso.liris.cnrs.fr/apeytavi/website/publication/hal-01339224/) wskazuje konstrukcję sieci odpływu i zlewni przed składaniem form terenu. Sprawdzono opis i abstrakt; pełny PDF nie był dostępny. To inspiracja porządku zależności, nie przyjęty generator lub kwalifikacja naturalności MiniFeniksa.

Wcześniejsze rozpoznanie portfolio obejmowało także własne formy, source/revision, lokalne dirty regions i ciągłość tożsamości. Nie przenosimy automatycznie ich siatek, tokenów runtime'u lub historii klonowanych całych scen do wielkiej Krainy. Konkretny transfer będzie opisany przy kodzie, gdy zacznie wykonywać potrzebną kompetencję.

Powyższe źródła służą decyzjom. Nie zaimportowano ich kodu, assetów, zależności lub dawnych testów do MiniFeniksa.


## Rzeczywisty transfer w drugiej budowie — 14.10.2026

`world/forms.ts` odzyskuje z JURE przeliczanie względem gospodarza, a `world/authoring.ts` i widok — rozdzielenie podglądu, anulowania i przyjęcia znane z HomeScan. To własne wykonanie tych zasad: forma posiada części oraz użycia, a scoped historia ponownie sprawdza żywą zajętość. Nie przeniesiono historii całej sceny, resetującej przeżyte skutki. Przykład: poznana nowa ława może zostać cofnięta, lecz jej tożsamości pozostają wycofane, a prywatne świadectwa nadal dają się odczytać.

`actors/actions.ts` rozdziela materialną próbę od samego wyboru braina, rozwijając naukę z Llm-Live-NPC. W tym przyroście nie przeniesiono modelu posiadania 2D ani nie podłączono usług modeli. Lokalna obserwacja ma rzeczywisty wpływ na zbiór, odpoczynek i rozpoznawanie brakującej przeszkody. Nowa porcja wchodzi do tego samego solvera, a zapis zachowuje jej zużycie.

Napęd nadal jest własnym ograniczonym rozwiązaniem native, nie odziedziczoną kwalifikacją V1. Blur zwalnia żądanie ruchu; ciało hamuje skończoną siłą. Ocenę tego zachowania i odczucia trzeba przeprowadzić w grze. Trwającego świata nie resetuje stop/start, podgląd autora lub cofnięcie formy.

## Kamera po pierwszym gameplayu drugiej budowy

Odczytano pełne rzeczywiste wykonania: [Character `follow-camera.js`, e7a98be](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/src/follow-camera.js), [JV `m6-chase-camera.ts`, 5c3830c](https://github.com/Jozzpoly/JV-Box3D-Web-experiment/blob/5c3830c01d58e42fb9b3705ff9948bdbe6071659/src/render/m6-chase-camera.ts) i [FrameMatter `camera_rig.gd`, 51552d3](https://github.com/Jozzpoly/FrameMatter-Lab/blob/51552d33cf3bbf62dea266c34448b496084c9a64/p1/camera_rig.gd).

Pierwsze dwa wyznaczają lub wygładzają położenie bez kontroli przecięcia terenu. FrameMatter rzeczywiście wykonuje sphere-probe i oddziela automatyczną prezentację od yaw sterowania. Odzyskano tę granicę odpowiedzialności: pionowa ochrona oka nie obraca WASD, a prezentacja nie przesuwa ciała. MiniFeniks ma własne sprawdzenie triangulowanego native terenu i ograniczony przekrój części; nie skopiowano całego riggu, nie wykonano teraz prób donorów i nie odziedziczono ich kwalifikacji.
