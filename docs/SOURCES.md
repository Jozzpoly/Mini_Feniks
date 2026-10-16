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

[Génevaux i współautorzy, 2013 — opis autora](https://perso.liris.cnrs.fr/apeytavi/website/publication/hal-01339224/) wskazuje konstrukcję sieci odpływu i zlewni przed składaniem form terenu. Pierwszy odczyt obejmował opis i abstrakt; 16.10 odzyskano również [pełny tekst z serwera współautora](https://www.cs.purdue.edu/cgvlab/www/resources/papers/Genevaux-ACM_Trans_Graph-2013-Terrain_Generation_Using_Procedural_Models_Based_on_Hydrology.pdf). Odczytano konstrukcję hierarchii dolin i operacji na formach oraz ograniczenia: brak ogólnej obsługi delt/starorzeczy i możliwe nienaturalne przejścia równin. To inspiracja porządku zależności, nie przyjęty generator lub kwalifikacja naturalności MiniFeniksa.

Wcześniejsze rozpoznanie portfolio obejmowało także własne formy, source/revision, lokalne dirty regions i ciągłość tożsamości. Nie przenosimy automatycznie ich siatek, tokenów runtime'u lub historii klonowanych całych scen do wielkiej Krainy. Konkretny transfer będzie opisany przy kodzie, gdy zacznie wykonywać potrzebną kompetencję.

Powyższe źródła służą decyzjom. Nie zaimportowano ich kodu, assetów, zależności lub dawnych testów do MiniFeniksa.


## Rzeczywisty transfer w drugiej budowie — 14.10.2026

`world/forms.ts` odzyskuje z JURE przeliczanie względem gospodarza, a `world/authoring.ts` i widok — rozdzielenie podglądu, anulowania i przyjęcia znane z HomeScan. To własne wykonanie tych zasad: forma posiada części oraz użycia, a scoped historia ponownie sprawdza żywą zajętość. Nie przeniesiono historii całej sceny, resetującej przeżyte skutki. Przykład: poznana nowa ława może zostać cofnięta, lecz jej tożsamości pozostają wycofane, a prywatne świadectwa nadal dają się odczytać.

`actors/actions.ts` rozdziela materialną próbę od samego wyboru braina, rozwijając naukę z Llm-Live-NPC. W tym przyroście nie przeniesiono modelu posiadania 2D ani nie podłączono usług modeli. Lokalna obserwacja ma rzeczywisty wpływ na zbiór, odpoczynek i rozpoznawanie brakującej przeszkody. Nowa porcja wchodzi do tego samego solvera, a zapis zachowuje jej zużycie.

Napęd nadal jest własnym ograniczonym rozwiązaniem native, nie odziedziczoną kwalifikacją V1. Blur zwalnia żądanie ruchu; ciało hamuje skończoną siłą. Ocenę tego zachowania i odczucia trzeba przeprowadzić w grze. Trwającego świata nie resetuje stop/start, podgląd autora lub cofnięcie formy.

## Kamera po pierwszym gameplayu drugiej budowy

Odczytano pełne rzeczywiste wykonania: [Character `follow-camera.js`, e7a98be](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/src/follow-camera.js), [JV `m6-chase-camera.ts`, 5c3830c](https://github.com/Jozzpoly/JV-Box3D-Web-experiment/blob/5c3830c01d58e42fb9b3705ff9948bdbe6071659/src/render/m6-chase-camera.ts) i [FrameMatter `camera_rig.gd`, 51552d3](https://github.com/Jozzpoly/FrameMatter-Lab/blob/51552d33cf3bbf62dea266c34448b496084c9a64/p1/camera_rig.gd).

Pierwsze dwa wyznaczają lub wygładzają położenie bez kontroli przecięcia terenu. FrameMatter rzeczywiście wykonuje sphere-probe i oddziela automatyczną prezentację od yaw sterowania. Odzyskano tę granicę odpowiedzialności: pionowa ochrona oka nie obraca WASD, a prezentacja nie przesuwa ciała. MiniFeniks ma własne sprawdzenie triangulowanego native terenu i ograniczony przekrój części; nie skopiowano całego riggu, nie wykonano teraz prób donorów i nie odziedziczono ich kwalifikacji.

## Ponowne badanie reprezentacji — 16.10.2026

Badanie kodu i wybranych istniejących prób, bez implementacji gry lub kopiowania donorów. Ponownie sprawdzono zdalne referencje ANVIL, FrameMatter, JURE, HomeScan, VAW, Simply, Gloop i planet. Piny gałęzi badawczych nie są utożsamiane z `main`. MinecraftLike-Fun-Project nadal zwraca puste repozytorium (Git API 409), więc nie daje obecnie kodu do odzyskania.

| Źródło i rzeczywisty kod | Odzyskiwana kompetencja | Granica dowodu |
| --- | --- | --- |
| [ANVIL `a87f33f`](https://github.com/Jozzpoly/PROJECT-ANVIL-Machine-Matter-Physical-Fabric-Laboratory/tree/a87f33f6adcefddf9356d09301299591cb362568), `src/model.ts`, `compiler.ts`, `foundation/mass-properties.ts` | Materiał/ID/skala źródła są odrębne od brył wykonawcy; masa i bezwładność wynikają z materiału, cuboidy zachowują otwory | Domyślna przyległość komórek daje sztywne połączenie. Niezależne wywołanie: sąsiadujące drewno i kamień dały jedną bryłę / dwa collidery; jawne rozdzielenie połączenia dało dwie bryły przy tej samej masie 43,75 kg. To próba kompilacji, bez native fizyki |
| ANVIL gałąź `29c83ea`, `studio-recovery/source.ts`, `realize.ts` | Odrębne intencje autora, lokalne naprawy odniesień, częściowa realizacja | Historia klonuje pełne źródło; nie stanowi dużego zapisu świata lub gotowej ścinki |
| [FrameMatter `3dbd232`](https://github.com/Jozzpoly/FrameMatter-Lab/tree/3dbd232f034a665a19a8f82426cf26aa4243bcec), `matter/matter_representation.gd`, `space/local_matter_space.gd`, `w0_anchored_detachment_policy.gd` | Lokalna odbudowa meshy/colliderów, lineage fragmentów i przeniesienie do lokalnego układu | Gęsta tablica całej objętości, przejściowe lineage niebędące trwałymi UUID; zakotwiczenie przez łączność nie liczy wytrzymałości. To przypięta ścieżka badawcza, nie obecny `main` `34e5a29` |
| [VAW `873933f`](https://github.com/Jozzpoly/voxel-aeronautics-workshop/tree/873933f1ebd8e98d05ad644a9dda2de47d467b1f), `src/game/visual_asset_loader.js`, `src/foundation/craft_model.js` | Osobna rewizja importowanego wyglądu oraz kopia podgrafu z remapowaniem wewnętrznych połączeń | Importowany model nie zmienia masy, kolizji, trwałości lub zachowania. Picking używa osobnego proxy; katalog lotniczych bloków nie jest ontologią krainy |
| JURE `d971b8b`, `src/kernel/types.ts`, `serialize.ts` | Odrębne pochodzenie źródła, wiązanie reprezentacji, lokalne ramy i zwalidowany dokument | Bez świeżej próby UI; role ram i zapis dokumentu nie ustanawiają żywego materiału |
| JV `5c3830c`, `jv-mesh-chunker.ts`, `jsprev2-scan.ts`, `jv-world-physics.ts` | Wspólne dane geometryczne i jawna własność zasobów | Podział Uint16/culling nie oznacza streamingu historii. Świeża próba: 103041 wierzchołków / 204800 trójkątów zachowane po podziale na dwa bufory; solver i przeglądarka nie były w tej próbie wykonywane |
| [Simply `b54904f`](https://github.com/Jozzpoly/Simply_game_experiment/tree/b54904f22819fc10e9202e389f6b77a03d67636a), `systems/terrain_system.py`, `level/level.py` | Faktyczne wczytywanie i wyładowywanie obszarów | Ponowna generacja gubi lokalną zmianę: marker 999 wrócił jako 0. Dekoracje przy ponownym generowaniu zmieniły liczbę 134→94. Wykonano metodę źródłową z zegarową granicą pygame i zastępczą ścieżką bez `noise`; nie pełną grę. Widok terenu nie jest źródłem kolizji wall-sprite |
| [Gloop `bd8bfab`](https://github.com/Jozzpoly/Gloopipelago/tree/bd8bfab5079bb1d1f596f9621d98ac522571b75a), `src/core/v1-mirror.mjs`, `tools/m11.mjs` | Przyczynowe zużycie pokarmu/energii, narodziny i śmierć; świeże cztery próby kontynuacji odtworzenia | Ograniczony świat 2D, nie model krajobrazu. Pełny odczyt jest narzędziową próbą, nie produkcyjnym API zapisu |
| planet `12eb5ec`, `SparseBlockedIndex`, `AnalyticOperationAuthority` | Falsyfikatory jam, tuneli, powłok i granicy próbkowania; 16/16 istniejących testów przeszło | Indeks przechowuje liczność zajętych próbek na blok; nie edytowalną materię. Obraz przekroju i predykaty nie dowodzą silnika krainy |

ANVIL/heir: ponowiono 32/32 istniejących prób źródła, kompilacji, historii i zapisu po usunięciu typów TypeScript, bez Box3D/Godot/obrazu. Podwojenie długości komórki daje masę ×8 i bezwładność ×32; ta sama zadana wartość momentu pozostaje niezmieniona. To kwalifikacja tych obliczeń, nie fizyki przyszłego świata. W lokalnym Simply `game.py` był wcześniej zmieniony względem pina; wnioski o wejściu/zapisie sprawdzono na `git show` przypiętego oryginału, nie zmienionym pliku.

### Zewnętrzne mechanizmy i ich ograniczenia

- [Voxel Tools — przegląd](https://voxel-tools.readthedocs.io/en/latest/overview/), [generatory](https://voxel-tools.readthedocs.io/en/latest/generators/), [koszt wykonania](https://voxel-tools.readthedocs.io/en/latest/performance/): różne meshery oddzielają dane od wyglądu, zmiany mogą odbudowywać lokalne regiony. Koszt colliderów i synchronizacji aktualizacji pozostaje znaczący. Modyfikatory autorskie i nadpisane bloki runtime mają określoną kolejność; nie jest to automatyczne scalanie poprawek autora z przeżytą historią.
- [Transvoxel — autor algorytmu](https://transvoxel.org/): przejścia między rozdzielczościami objętości. To mechanizm zszywania powierzchni, nie komplet persystencji, fizyki, materiałów lub wytrzymałości.
- [Arches, Peytavie i współautorzy 2009 — tekst autorów](https://perso.liris.cnrs.fr/egalin/Articles/2009-arches.pdf): kolumny wielu warstw materiałów, w tym powietrza, połączone z reprezentacją implicit; jaskinie, nawisy i narzędzia kształtowania. Odczytano opis modelu, bez wykonania implementacji. To wariant pomiędzy pojedynczą wysokością a pełną tablicą próbek 3D; reprezentacja oderwanych ruchomych części wymaga odrębnej oceny.
- [OpenVDB — dokumentacja projektu](https://www.openvdb.org/documentation/doxygen/): hierarchiczna rzadka objętość, CSG i narzędzia przekształcania. Oszczędny magazyn danych nie ustanawia sam zachowania rzeczy, lokalnych połączeń lub szybkości naszego runtime'u.
- [Génevaux 2013](https://www.cs.purdue.edu/cgvlab/www/resources/papers/Genevaux-ACM_Trans_Graph-2013-Terrain_Generation_Using_Procedural_Models_Based_on_Hydrology.pdf), [Tzathas i współautorzy 2024](https://www-sop.inria.fr/reves/Basilic/2024/TGSC24/), [Ecormier-Nocca i współautorzy 2021](https://www-sop.inria.fr/reves/Basilic/2021/ECCMMBC21/): kontrola geografii przez hydrologię/erozję oraz powiązanie roślin, zasobów i tras. Ekosystem stanu ustalonego w publikacji 2021 nie jest dowodem samodzielnego życia NPC. Naturalność i własna kompozycja nie wynikają z wybranego formatu voxeli.
- [Teardown — opis twórcy 2026](https://blog.voxagon.se/2026/03/13/teardown-multiplayer.html): trwałe zmiany obejmują także podział hierarchii i zmianę połączeń. Samo wycięcie próbek jest tylko częścią materialnego skutku. Nie przenosimy wymogu multiplayer ani silnika Teardown.
- [Luanti — persystencja](https://docs.luanti.org/for-creators/api/persistence/): odrębne trwałe dane mapy i aktywowanych obiektów. To referencja granicy przechowywania, nie wybór silnika.

Rachunek skali, nie pomiar gry: przy przykładowym zakresie 6×4 km i 256 m wysokości gęsty magazyn komórek 25 cm wymagałby około **366 GiB dla jednego bajtu na komórkę**, a dla czterech — około 1465 GiB. Nie ustanawia to budżetu świata lub rozdzielczości. Pokazuje, dlaczego pełna gęsta tablica FrameMatter nie może zostać przeniesiona wprost. Rzadkie przechowywanie, różne skale i lokalne układy pozostają kandydatami do pomiaru.

### Granica Studio

[Feniks Studio `7c8666e`](https://github.com/Jozzpoly/Feniks-Studio/tree/7c8666ebf88a19c0b4b06c1c9dc9955b9e7c34ba) w sprawdzonych zdalnych gałęziach zawiera projekt i plan, bez aplikacji lub wykonanego mostu. Nie wyklucza to nieopublikowanej pracy. Jego instrukcje zabraniają uznawania formatu MiniFeniksa za obowiązkowy format Studio. Odrębna rewizja assetu, umieszczenie i archiwum projektu są tam propozycjami. Nie budowano w tym badaniu importera, nowego frameworka lub konkurencyjnego edytora.


## Zastosowanie w kampanii 04 — 16.10.2026

- Character/E19: zachowano wzajemną, skończoną reakcję chwytu; nowa adaptacja używa rzeczywistych mas obu native ciał, tłumienia zależnego od masy i ograniczonego momentu yaw. Próba porcji 0,18 kg obaliła wcześniejsze stałe K/D: chwyt zrywał się po rozkołysaniu. Nowe próby obejmują także zwykłą torbę i przeciążenie. To nasza adaptacja, nie skopiowana kwalifikacja donora.
- Llm-Live-NPC: wykorzystano rozdział prośby, trwającej pracy, przerwania i materialnego zatwierdzenia. Nie dołączono LLM/API ani zdalnego planera. Prywatna troska o zapas jest małą bieżącą kompetencją; nie dziedziczy pełnego rozumowania projektu NPC.
- ANVIL/FrameMatter: materiał określa masę luźnych brył, zaś dotyk nie tworzy sztywnego połączenia. Nie przeniesiono całego modelu komórek, grafu konstrukcji lub frameworka.
- Jaskinia: jej idea taniego feedbacku zainspirowała mały ślad gameplayu do pliku (ostatnie zdarzenia, zamiary i stan czynności), bez nowej integracji usług lub transmisji danych.

Żaden z tych transferów nie kwalifikuje jeszcze samodzielnego życia wspólnoty, realistycznej konstrukcji, całego ekosystemu lub jakości artystycznej krainy. Wyniki native i próby interfejsu zapisujemy w [BUILD-04](BUILD-04.md).
