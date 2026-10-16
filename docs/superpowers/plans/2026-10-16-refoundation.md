# Żywa Kraina — kampania przebudowy / Implementation Plan

> **For agentic workers:** wykonuj kolejne zatwierdzone zakresy przez `superpowers:executing-plans` lub `superpowers:subagent-driven-development`. Prowadzący odpowiada za wspólne kontrakty i integrację; nie uruchamiaj równolegle sprzecznych przebudów. Ten dokument jest wynikiem zleconego planowania, nie poleceniem natychmiastowego rozpoczęcia wszystkich etapów.

**Goal:** zbudować znacznie lepsze miejsce do grania i życia: dostępne, piękne, materialnie zmienne, zamieszkane przez ludzi z własnymi sprawami, wewnątrz jednej rozległej krainy.

**Architecture:** przebudowa przez kolejne działające przyrosty tej samej gry. Źródło terenu przestaje zależeć od globalnej funkcji aktualnego buildu; później rzeczywista przemiana materiału wyznacza potrzebny model rzeczy i ich historii. Obraz, kontakt i zapytania aktorów korzystają z uzgodnionej geometrii, a prywatna wiedza nadal wymaga świadectwa.

**Tech Stack:** roboczo TypeScript, Three.js 0.183.0, Box3D 0.1.1, istniejący Vite/Vitest i prywatny webowy podgląd. To kandydaci, nie ograniczenie docelowej gry. Godot ani Emscripten nie są obecnie dostępne lokalnie; przejścia do innego stosu nie przedstawiamy jako już sprawdzonej drogi.

**Spec:** [wnioski i robocze decyzje w FOUNDATION](../../FOUNDATION.md#propozycja-następnej-kampanii--16102026). [SOURCES](../../SOURCES.md#ponowne-badanie-reprezentacji--16102026) zachowuje piny i granice prób; [BUILD-03](../../BUILD-03.md) — wykonane kontrprzykłady.

## Global Constraints

- Rozwijamy jedną krainę; kopia bezpieczeństwa i stany pośrednie nie są konkurencyjnymi produktami.
- Feniks Studio jest edytorem mapy. Nie budujemy jego substytutu w MiniFeniksie ani nie narzucamy mu formatu gry.
- Gracz jest pełnoprawnym aktorem. Wspólna czynność oznacza wspólne warunki i skutki materialne, nie identyczny interfejs decyzji gracza i mieszkańca.
- Żaden istniejący fundament nie ma immunitetu. Zmieniamy go dla wykazanej korzyści, zachowując wiedzę i rozliczając historię świata.
- Przyziemne europejskie fantasy średniowieczne; obrazki koncepcyjne nie stanowią zatwierdzonej geografii lub kultury.
- Dla pierwszego terenu nadal powierzchnia wysokościowa, ale odtwarzana z zapisanej rewizji źródła, zamiast globalnego callbacku bieżącego buildu.
- Nie projektujemy najpierw uniwersalnego systemu instancji. Tożsamość po podziale, zapis i poprawkę autora rozstrzygniemy na faktycznej przemianie.
- Techniczny PASS nie jest oceną jakości grania. Każdy przyrost oglądamy i rozgrywamy, zanim uznamy jego obietnicę za osiągniętą.

## Review Focus

Pięć szczególnie ważnych przypadków i ich właściciele:

1. Stary zapis po zmianie domyślnego terenu: zachowuje własną geografię, ludzi i rzeczy, bez cichej migracji — zadanie 1.
2. Nowa ziemia przecina człowieka, niesiony przedmiot lub podporę; przygotowanie kończy się po próbie innej zmiany: wyłączna transakcja i odrzucenie bez częściowej podmiany — zadanie 2.
3. Osoba oscyluje, zaczyna legalne obejście lub śledzi poruszający się cel: rozpoznanie braku postępu bez pomylenia waypointu z ukończoną czynnością — zadanie 3.
4. Kontroler dochodzi sam, ale psuje niesienie, próg lub spotkanie z drugim ciałem: nie kwalifikujemy go jako rozwiązania — zadanie 4.
5. Ładny widok maskuje nieczytelną czynność, przeszkodę lub pustkę: rzeczywisty spacer i ocena bliska/daleka, nie tylko screenshot — zadanie 5.

## Wniosek prowadzącego

Największym problemem jest rozdzielenie obietnic: krajobraz wygląda jak materialny świat, ale las jest głównie rendererem; rzeczy wyglądają inaczej niż ich pudełka kontaktu; ludzie krążą między punktami obsługi potrzeb. Dopisanie kolejnych zasobów, form i nazw celów utrwaliłoby ten pułap.

Duża zmiana nie musi oznaczać jednoczesnego wyrzucenia całego kodu. Potrzebujemy wymiany słabych powiązań i coraz lepszego doświadczenia po każdym etapie. Odcinek doliny jest pierwszym miejscem pracy, nie nową granicą świata. Nie kończymy kampanii na doskonałej polanie.

## Kolejność i wyniki kampanii

| Etap | Rzeczywista zmiana | Kontakt z grą / warunek odrzucenia |
| --- | --- | --- |
| **1. Przestrzeń, ciało, czytelność** | Odtwarzalne źródło ziemi, przekomponowane dojścia, kompetentny ruch, czytelna kamera i spójniejsza kompozycja zamieszkanego skraju doliny | Swobodny spacer dom–polana–skraj lasu i powrót, wejście przez próg, niesienie oraz spotkanie. Niewidzialne blokady, przymus teleportu lub sama ładna panorama obalają wynik |
| **2. Materiał, który naprawdę zmienia postać** | Przebudowa wąskiego `PartSource`/`Thing` i zależności od autorskich form na podstawie rzeczywistego podziału, przenoszenia oraz użycia fragmentu | Różne miejsca cięcia dają odpowiadające pozostałości. Ten sam materiał ma przynajmniej dwa sensowne zastosowania. Stały prefabrykowany uzysk, ghost collider lub odrodzenie po odczycie obalają drogę |
| **3. Własne sprawy ludzi** | Trwający zamiar, widoczne wykonanie, zachowany postęp, przerwanie i osobna odpowiedź drugiej osoby, oparte na wspólnych rzeczach | Gracz pomaga, zabiera materiał, zmienia dostęp lub odchodzi; człowiek lokalnie odkrywa skutek i realnie kontynuuje, rewiduje albo porzuca zamiar. Nowy tekst przy tej samej kolejce czynności nie wystarcza |
| **4. Dalszy świat i powrót** | Odmienne sąsiedztwo, inne użycie materiału, ciągłość po oddaleniu, zapisie i poprawce autorskiego projektu | Powrót nie regeneruje przeżytego miejsca; podróż prowadzi do czegoś wartego poznania. Jeżeli po pierwszej sprawie świat ponownie pustoszeje, poprawiamy treść i zależności przed dodaniem kilometrów |

Etapów 2–4 nie rozpisujemy teraz do klas i commitów: wynik wcześniejszego może słusznie zmienić ich architekturę. Nie wymagamy idealnego etapu 1 przed podjęciem etapu 2; wymagamy rzetelnego ruchu, kontaktu i obrazu wystarczającego do oceny materialnej przemiany. Pierwszą spójną wersję spaceru pokazujemy już po połączeniu nowego dojścia z wykonawcą ciała; dalsza praca nad obrazem nie zatrzymuje wejścia w materiał i życie. Jeśli po dwóch przyczynowych próbach naprawy nadal tylko stroimy podobne parametry, wracamy do wyboru wykonawcy, zamiast rozpoczynać trzecią taką samą rundę.

### Decyzja o reprezentacji w etapie 2

Kandydat startowy: materialna kompozycja lokalnych brył/segmentów. Dla pierwszej ścinki obszar i kierunek dopuszczalnego przecięcia mają być jawne; fragment wynika z przecięcia, nie z recepty „3 drewna”. Nie obiecujemy arbitralnego CSG i wytrzymałości każdego włókna.

Obecny las nie stanie się materialny przez dodanie kolizji do instancji Three.js. Najpierw ustanawiamy źródło rośliny i jej przeżyty stan; obraz staje się projekcją. Nie przydzielamy obowiązkowo trwałego ID każdej próbce. Na pierwszym użytkowym fragmencie rozstrzygamy pochodzenie, zachowaną ilość materiału, następstwo odniesień i zapis. Przyległość nie oznacza zespolenia; położona belka może po prostu spoczywać na podporach.

Najmniejsza pełna próba: różne cięcia tego samego drzewa w kontrolowanych stanach testowych, przeniesienie i obrót fragmentu, użycie przy domu, zapis/odczyt, poprawka samego wyglądu źródła. Dwa stany testowe nie są dwiema rozwijanymi krainami. Pozostałość i wyniesiony materiał mają przetrwać poprawkę bez odtworzenia ściętej rośliny. Nie uzależniamy tej próby od gotowego Studio: do czasu rzeczywistego mostu prowadzący przygotowuje własną rewizję źródła w repo, bez zlecania Ownerowi programowania lub budowy kolejnego edytora.

Jeżeli bryły wymagają wyjątków dla kolejnych cięć lub nadmiernie ograniczają autorską formę, następny kandydat to lokalna rzadka materia z podziałem i lokalnymi układami. Ziemia, jej wykopy i granica korzenie–brzeg wymagają wtedy własnego rozstrzygnięcia. Nie ogłaszamy hybrydy zwycięzcą i nie budujemy równolegle pełnego silnika voxelowego.

### Pierwsza własna sprawa w etapie 3

Wybierzemy ją z już użytecznej przestrzeni i materiałów, a nie z osobnej fabuły. Kandydat: człowiek chce uporządkować lub osłonić własne rzeczy w konkretnym miejscu; drugi ma inny interes dotyczący dostępu lub odpoczynku. To robocze sytuacje, nie zatwierdzona własność, prawo lub kultura plemienia. Wspólny posiłek również pozostaje tylko kandydatem.

Odzyskujemy z Llm-Live-NPC zachowanie związku sprawy z wynikiem, możliwość kontynuacji/odmowy i odrębną odpowiedź. Nie przenosimy całego frameworka ani nie uruchamiamy modeli jako substytutu fizycznych możliwości. Pierwsze czynności mają trwanie i warunki przerwania wspólne dla gracza/NPC; jedzenie, powitanie lub praca nie mogą być wyłącznie natychmiastową zmianą liczb.

## Pierwszy etap — zakres do wykonania

### Zadanie 1: odtwarzać ziemię zapisu, zamiast przymusowo przechodzić na bieżący build

**Pliki:** nowe `src/world/terrain.ts`, `tests/terrain-history.test.ts`; zmiany `src/world/geography.ts`, `source.ts`, `resources.ts`, `startup.ts`, `migration.ts`, `src/session.ts`, `src/main.ts`, `src/physics/index.ts`, `src/view/landscape.ts` i testów ich integracji. Skrócone nazwy w tej liście odnoszą się do `src/world/`.

**Interfejs:** `resolveSavedTerrain(source: RegionSource): HeightTerrain`. Wynik ma `recipeId: string` oraz związane z tą receptą funkcje `heightAt`, `drainageAt`, `ecologyAt`, `hash` i `noise` o obecnych argumentach/wynikach z `geography.ts`. To adapter istniejących powierzchni wysokościowych, nie uniwersalny kontrakt całej przyszłej materii. `recipeId` identyfikuje komplet faktycznie używanych danych i algorytm; samo ziarno nie wystarcza. Woda korzysta z kanałów tej samej recepty. Konstruktor regionu i zakładanie miejsc zasobów nie mogą dalej używać globalnego podłoża.

- [ ] Napisać nieprzechodzące przypadki: odczyt `jaworowa-drainage-1` zachowuje dawny relief i położenia; zapis `jaworowa-drainage-2` zachowuje obecny relief mimo zmiany domyślnego przepisu; nieznany przepis daje błąd bez zapisu zastępczego.
- [ ] Uruchomić `npm test -- tests/terrain-history.test.ts tests/startup.test.ts tests/migration.test.ts`; potwierdzić, że nowe wymagania zawodzą z właściwego powodu.
- [ ] Odłączyć automatyczną migrację terenu od zwykłego odczytu. Zachować interpretację dawnych znanych recept, a migrację struktury form oddzielić od zmiany geografii. Usunąć wymóg `source.terrainVersion === TERRAIN_VERSION` jako jedyny sposób otwarcia historii. Historycznych przepisów nie parametryzować nowymi danymi, których dawniej nie używały.
- [ ] Przekazać rozstrzygnięte podłoże do obrazu, fizyki i pochodnych terenu. Wczytanie w `Session.load` rozstrzyga receptę nowego zapisu, zamiast używać callbacku poprzedniego świata. Sprawdzić także wodę i roślinność; zgodna sama siatka ziemi nie wystarcza.
- [ ] Dodać test porównujący odczyt zapisanej recepty z obrazem i zasobami po zmianie domyślnej recepty aplikacji. Usunąć lub przepisać dawne asercje wymagające automatycznej migracji wysokości; zachować ich ochronę czasu, tożsamości i zużycia.
- [ ] Powtórzyć wskazane testy oraz `tests/terrain-contact.test.ts`, `tests/landscape-lifecycle.test.ts`, `tests/session.test.ts`. Zatwierdzić oddzielny, odtwarzalny przyrost w git. Ten krok sam nie jest poprawą krajobrazu lub ukończeniem etapu.

### Zadanie 2: skomponować przejście miejsca życia w otwartą krainę

**Pliki:** `src/world/geography.ts`, `src/world/source.ts`, `src/world/terrain.ts`, `src/world/terrain-surface.ts`, `src/world/types.ts`, `src/world/checkpoint.ts`, `src/session.ts`, koordynacja w `src/main.ts` i przygotowanie projekcji w `src/view/landscape.ts`; nowe `tests/terrain-revision.test.ts`; `tests/geography.test.ts`, `tests/terrain-surface.test.ts` i `scripts/probe-approaches.ts`.

**Interfejs:** `Session.reviseTerrain(nextSource: RegionSource): Promise<{ accepted: boolean; reason: string }>` — wewnętrzna operacja techniczna, nie nowy edytor mapy. Przy odmowie stan, bieżąca fizyka i zapis pozostają bez zmian. Przy przyjęciu obraz, ciało i późniejszy odczyt używają tego samego źródła.

**Granica operacji:** rozpoczęcie po zakończonym kroku; wyłączna blokada `advance`, `act`, `author`, `edit`, undo/redo, `load` i kolejnej rewizji na czas przygotowania. To blokada niezależna od przycisku pauzy. Autosave może zapisać wyłącznie poprzedni ukończony stan. Po porażce wracają wcześniejszy stan pauzy i reprezentacje; kandydat jest zwalniany. Zmiana dotyczy tylko danych geografii; różnica w formach, użyciach lub innych autorskich danych `nextSource` oznacza nieaktualną/błędną propozycję i odmowę. Koordynator przygotowuje projekcję widoku przed finalizacją i przełącza ją bez asynchronicznej przerwy po przyjęciu stanu; Session nie staje się właścicielem renderera.

- [ ] Utrwalić przed zmianą profil i native odległości z istniejącego `probe:approaches`. Przygotować test odmowy zmiany wcinającej ziemię w osobę, trzymaną rzecz lub używaną podporę, z niezmienionym checkpointem po odmowie.
- [ ] Opracować jedną nową autorską rewizję tej geografii: szerokie przejście poziomu domu w stok, czytelny odpływ, dojście do skraju lasu i wariant powrotu. Zakres wynika z rzeźby i zlewni, nie kolejnego prostokątnego kołnierza. Nie spłaszczać wszystkich stoków i nie przywracać błędów dawnego odpływu.
- [ ] W tym kroku utrwalić źródło nowej kompozycji i dopiero z niego wyprowadzić konkretny typ danych nowej recepty w `types.ts`, walidację w `checkpoint.ts` oraz jej interpretację w `terrain.ts`. To jawna zależność od pracy nad geografią, nie gotowy format: nie zlecać tych trzech plików równoległym implementerom przed decyzją prowadzącego.
- [ ] Zapisać komplet parametrów nowej recepty przy regionie i nadać jej osobną wersję. Nowe źródło od początku zasila ziemię, wodę, rozmieszczenie roślin i sprawdzanie podpory. Nie ukrywać nowej mapy pod `jaworowa-drainage-2`. Zmiana schematu ma własną walidację i jawne wejście ze starej historii; nie rozluźniać obecnej ścisłej walidacji do przyjmowania dowolnego JSON.
- [ ] Przygotowywać nową reprezentację przed przełączeniem. Zachować czas, tożsamości, zużyte zapasy i prywatną wiedzę; nie przesuwać ludzi lub rzeczy automatycznie na nową wysokość. Przy konflikcie poprawić propozycję źródła. Zachować niezmieniony stary checkpoint przed jawnym przyjęciem rewizji.
- [ ] W teście opóźnić przygotowanie; spróbować wykonać krok, czynność, odczyt i drugą rewizję. Potwierdzić wyłączność, niezmieniony czas i checkpoint, a po wymuszonej porażce poprawne zwolnienie kandydata i odblokowanie gry. Osobno odrzucić nieaktualną propozycję nadpisującą zmienioną formę. Awaria przygotowania widoku nie może pozostawić nowej ziemi tylko w fizyce.
- [ ] Uruchomić testy tego zadania i `npm run probe:approaches`. Oczekiwanie użytkowe: skraj polany i zachodnie dojście osiągalne w dotychczasowym promieniu 0,6 m, bez rozluźniania go dla zielonego wyniku. Porównanie kontrolne starego terenu nadal musi być dostępne. Wynik niespełniony rozstrzyga zadanie 4, nie retusz raportu.

### Zadanie 3: rozróżnić próbę dojścia, obejście i rzeczywistą porażkę

**Pliki:** nowe `src/actors/approach-progress.ts`, `tests/approach-progress.test.ts`; `src/session.ts`, `life/index.ts`, `world/types.ts`, `world/checkpoint.ts`, `tests/living-continuity.test.ts`.

**Interfejs:** `updateApproachProgress(previous: ApproachProgress | null, sample: ApproachSample): ApproachProgress`. `ApproachSample` obejmuje `time: number`, `position: Vec3`, `targetId: string | null`, `segmentId: string | null`, `waypoint: Vec3 | null`, `wantsMovement: boolean`, `arrived: boolean`; wynik zachowuje początek okna, porównywalny odcinek i rozróżnia `moving`, `arrived`, `stalled`, `idle`. Warunek `arrived` podaje właściciel czynności, z jej własnym zasięgiem; dotarcie do waypointu nie jest ukończeniem zamiaru. `segmentId` zmienia się po rzeczywistej zmianie odcinka, nie przy każdej korekcie pozycji celu. Punktem startowym pomiaru jest 6 s bez co najmniej 0,25 m postępu ruchu ku punktowi pośredniemu; sam ruch celu nie zeruje okna. To parametr roboczy, do weryfikacji na wykonanych próbach, nie niezmienna reguła świata.

- [ ] Najpierw przypadki oscylacji z niezerową prędkością, legalnego obejścia, zmiany odcinka, dojścia i ustania żądania ruchu. Samo oddalenie od celu końcowego nie jest dowodem utknięcia. Dodać osiągnięty waypoint przy `arrived=false`, ruchomy cel o tym samym ID przy zablokowanym ciele oraz normalne podążanie za oddalającym się człowiekiem — bez fałszywego zgłoszenia fizycznej blokady.
- [ ] Zastąpić wykrywanie utknięcia oparte wyłącznie na małej prędkości oceną postępu względem bieżącego dojścia. Rozróżnić porażkę lokalnego odcinka od dowodu globalnej nieosiągalności celu.
- [ ] Zapisać właściwe lokalne świadectwo i powód przerwania. Rewizja ziemi nie uaktualnia zdalnie pamięci mieszkańca. Unikać natychmiastowej ponownej próby tego samego odcinka bez zmiany przesłanek.
- [ ] Sprawdzić `npm test -- tests/approach-progress.test.ts tests/life.test.ts tests/living-continuity.test.ts tests/session.test.ts`. Utrwalić przypadek kończący się odpoczynkiem po nieudanym dojściu z prawdziwym powodem, zamiast ogólnego „nic mnie nie przynagla”.

### Zadanie 4: wybrać prowadzenie ciała na rzeczywistych przejściach

**Pliki:** `src/physics/index.ts`; wydzielany przy potrzebie `src/physics/character.ts`; `tests/physics.test.ts`, `tests/actors.test.ts`, `tests/terrain-contact.test.ts`, `scripts/probe-approaches.ts`.

**Wejście/wyjście:** zachować wspólny kontrakt `Drive` i zakończony stan postaci. Jeśli nowy wykonawca potrzebuje zmiany kontraktu, prowadzący rozstrzyga ją przed integracją; widok lub brain nie dopisują drugiego właściciela pozycji.

- [ ] Najpierw odtworzyć testy kontrprzykładów: zwykły stok, załamanie podpory, sześć rzeczywistych stopni domu, niesienie, drugie ciało i ruchoma podpora. Mierzyć końcowe dojście, podparcie i reakcję ciężaru, nie tylko brak wyjątku.
- [ ] Pierwszy kandydat: kompetentniejsze podparcie/kontakt i prowadzenie obecnego materialnego ciała. Nie zwiększać bezkrytycznie siły napędu. Odzyskać z Character rzeczywiste rozumienie kontaktu, płaszczyzn i pokonywania terenu; wersję adaptera sprawdzić przeciw obecnemu Box3D.
- [ ] Jeżeli ten kandydat nie rozwiązuje konkretnych prób, porównać rzeczywisty mover donora w tym samym wykonaniu testowym i sprawdzić jego wzajemność. Nie importować V1 jako gotowego zwycięzcy na podstawie samotnego dojścia. Zachować jednego zwycięskiego wykonawcę produktu, diagnostyczne porównanie może pozostać testem.
- [ ] Uruchomić wskazane testy, `probe:approaches` i rzeczywisty spacer w przeglądarce. Teleport, przenikanie, brak reakcji niesionej masy lub nieskończona korekta podparcia obalają kwalifikację. Gdy potrzebna jest wymiana solvera lub stosu, zapisać konkretną blokadę i koszt migracji, zamiast łatać ją poza wykonawcą.

### Zadanie 5: dostarczyć miejsce, nie pakiet technicznych napraw

**Pliki:** `src/view/landscape.ts`, `objects.ts`, `index.ts`, `camera-ground.ts`, `actor-cutaway.ts`, `src/ui/index.ts` i `style.css` według ujawnionych problemów. Testy widoku i sterowania adekwatne do faktycznej zmiany.

- [ ] Skomponować spójny obraz tego odcinka: skala człowieka i budynku, sylwetki roślin, podszyt i przerwy, materiały, światło, bliski detal oraz dalekie powiązanie z doliną. Nie podmieniać całego stylu na modny szablon. Nie dopracowywać kilku wariantów krainy.
- [ ] Poprowadzić zwykły spacer w Graj: wyjście, otoczenie domu, las, powrót, podjęcie i odłożenie rzeczy, spotkanie. Sprawdzić czytelność ruchu i upływu czasu. Zachować swobodne oglądanie; diagnostyka nie powinna dominować nad grą.
- [ ] Przed podmianą prywatnego podglądu zachować potwierdzoną kopię zapisu. Testy prowadzić w izolowanym podglądzie lub tej samej kontrolowanej sesji; nie otwierać drugiej karty zapisującej na ten sam checkpoint. Nie dorabiać z tego osobnego projektu wielu kart.
- [ ] Raz wykonać końcowe `npm test` i `npm run build` dla gotowego zakresu, niezależny przegląd diffu oraz rzeczywisty obraz GPU. Zmierzyć czas startu, ciężki kadr i zwykły ruch na dostępnym komputerze; budżet samej siatki nie jest wynikiem wydajności gry.
- [ ] Dostarczyć pod tym samym prywatnym adresem zgodnie z aktualnym workflow Sites, zachowując zakres dostępu. Krótko podać zmianę, znane słabości i następny krok. Pokazać przyrost przed domknięciem etapów 2–4. Brak feedbacku Ownera oznacza „dostarczone do oceny”, nie „Owner PASS”.

## Odzyskiwanie kompetencji i podział pracy

| Problem | Donor / lekcja | Granica transferu |
| --- | --- | --- |
| Kontakt i chodzenie | Character: rzeczywiste płaszczyzny kontaktu i mover; JV: wspólna geometria | Samotny V1 nie kwalifikuje masy i spotkania osób; różne wersje Box3D |
| Podział materiału | ANVIL: materiał, masa, bezwładność; FrameMatter: lokalna odbudowa i fragmenty | Nie kopiować domyślnego zespolenia sąsiadów, gęstej całej tablicy ani nietrwałego lineage jako światowego ID |
| Własne modele i rewizje | VAW/JURE: pochodzenie, lokalne ramy, osobny wygląd; HomeScan: przejścia i jawne remapowanie | Model wizualny nie dostaje automatycznie kolizji lub zachowania. Studio zachowuje własną architekturę |
| Własna sprawa i lokalne poznanie | Llm-Live-NPC / ReflexBrain | Zmiana samego uzasadnienia bez zmiany zachowania pozostaje porażką |
| Dalszy zasięg | Simply: rzeczywista rezydencja obszarów; Gloop: przyczynowy obieg zasobów | Regeneracja nie zachowuje historii; model ekologii z laboratorium nie staje się od razu ekosystemem krainy |

Prowadzący integruje. Niezależny zakres można delegować geometrii/kompozycji, kontrprzykładom kontrolera i przeglądowi zapisu. Nie delegować równocześnie kilku zmian wspólnego `WorldState` i `Session` bez uprzednio uzgodnionej własności. Maksymalizujemy trafność i rezultat, nie liczbę agentów lub dokumentów.

## Pętla kampanii i warunki zmiany planu

1. Odzyskać HEAD, aktualny zapis, autoryzację i jedno pytanie, które następna zmiana rozstrzyga.
2. Odtworzyć odpowiedni kontrprzykład; wybrać fragment rzeczywistego donora, jeśli wnosi udowodnioną kompetencję.
3. Zmienić mały spójny zakres, wykonać właściwe testy i zagrać. Nie bronić testu chroniącego zły efekt.
4. Ocenić zarazem materiał, ruch, obraz i sens działania. Gdy poprawa jednego psuje inne, rozwiązać powiązanie przed skalowaniem.
5. Zachować kod, migrację, zakres dowodu i następny konkretny krok. Aktualizować ten plan przy zmienionej decyzji, nie tworzyć następnego wielkiego audytu.

**Pierwszy uzasadniony ruch wykonawczy:** rozdzielić odczyt istniejącej geografii od jej zmiany, a następnie w tej samej historii przebudować dojścia wraz z kwalifikacją ciała. Nie zaczynać od nowego katalogu czynności, importera VOX, frameworka braina lub budowy edytora.

Koniec etapu 1 nie oznacza końca pracy: przy rozstrzygniętych kontaktach i czytelnym miejscu następny wartościowy krok to etap 2. Jeżeli przeciąga się wyłącznie dopieszczanie krajobrazu, przechodzimy do jego materialnego użycia. Jeżeli przemiana materiału daje tylko efektowny pokaz, przed rozszerzaniem jej zakresu łączymy ją z własną sprawą mieszkańca. Jeśli podstawy ponownie dają słabe owoce — wymieniamy je, nie chronimy planu.
