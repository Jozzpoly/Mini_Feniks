# Druga kampania — uczestnictwo i tworzenie

14.10.2026 · Owner wznowił właściwą implementację · jeden przyrost tej samej krainy

**Cel:** autor może budować i przekształcać spójne formy, gracz działa własnym ciałem, a mieszkańcy używają materialnych możliwości i kontynuują własne życie. Nadal rozwijamy rozległą, naturalną krainę w przyziemnym europejskim fantasy. Pierwszy przyrost nie ustanawia ostatecznego modelu kultury, wyglądu lub kontrolera.

## Decyzje wykonawcze

- Formy posiadają części i lokalne miejsca używania. Kompozycja domu, ławy i stołu otrzymuje jedno źródło relacji; przesunięcie lub obrót formy przenosi jej własne części i użycia. Obraz i kolizje są projekcjami. Dane prywatnej obserwacji pozostają wcześniejszymi świadectwami do nowej obserwacji.
- Gest ma oddzielny podgląd, anulowanie i przyjęcie. Historia autora cofa formę, nie czas, zjedzony posiłek, pamięć ani cudze działanie. Cofnięcie ponownie sprawdza bieżące zajęcie. Tworzenie i usunięcie zachowują tożsamość oraz historię, a nie wymagają restartu.
- Gracz jest osobą w tym samym solverze; sterowanie ma osobne źródło od wyborów NPC. Wspólne rozstrzygnięcie sprawdza zasięg, widoczność, trzymanie i rzeczywisty zasób. Napęd i chwyt są skończone. Native kapsuła jest bieżącym kandydatem do oceny zachowania, nie domyślnym zwycięzcą nad Character V1.
- Możliwości dalszego życia powstają z lokalnie poznanych miejsc, zasobów i następstw. Nie odtwarzamy początkowej torby lub chleba. Pierwsze poszerzenie obejmuje zdobywanie skończonego jedzenia, odpoczynek i poznawanie sąsiedztwa; nie kwalifikuje pełnej gospodarki lub świadomości.
- Jedna generowana siatka terenu zasila render i native geometrię. Najbliższy ciek nie może przełączać wysokości całej doliny skokiem. Poprawa źródła zachowuje poziom zamieszkanego tarasu. Odczyt dawnego świata ma jawną migrację, zachowującą osoby, czas, zużycie i pamięć.
- Pierwszy kontakt: czytelny tryb grania / oglądu / tworzenia; ruch względem kamery, interakcja i fizyczna postać; widoczny bieg czasu oraz następstwa wyboru. Edytor umożliwia bezpośrednią manipulację i tworzenie potrzebnych form; liczby pozostają opcjonalnym narzędziem dokładności.

## Plan implementacji

> Wykonanie w bieżącej sesji. Root utrzymuje wspólne interfejsy; wyraźnie niezależne pliki mogą mieć osobnego wykonawcę. Każda zmiana zachowania ma sprawdzian RED → GREEN. Zgoda Ownera obejmuje samodzielny wybór architektury i sposobu wykonania.

**Technika:** obecne TypeScript, Three.js, Box3D 0.1.1; bez nowej usługi modeli i bez nowego konkurencyjnego świata.

### 1. Formy i ciągłość źródła

Pliki: `src/world/types.ts`, `forms.ts`, `authoring.ts`, `source.ts`, `checkpoint.ts`, `revisions.ts`; próby w `tests/forms.test.ts` i `world-state.test.ts`.

- [x] RED: zmiana ławy przenosi nogi i lokalne użycie, pozostawiając stół, zapisany czas i prywatną pamięć.
- [x] Wprowadzić `FormSource`, przeliczanie lokalnych układów i projekcję części/użyć. Zachować import pierwszego źródła; nowy zapis jednoznacznie odróżnia źródło od projekcji.
- [x] `editForm`, `createForm`, `removeForm`, `undo` / `redo` działają na wskazanym zakresie. Konflikt osoby lub rzeczy odrzuca zmianę bez częściowego skutku. Usunięcie formy nie wymazuje dawnych obserwacji.
- [x] GREEN: obrót, zagnieżdżenie, odczyt i odrzucenie zajęcia; cofanie po upływie czasu nie cofa życia.

### 2. Ziemia pod stopami

Pliki: `src/world/geography.ts`, `terrain-surface.ts`, `src/view/landscape.ts`; integracja solvera w `src/physics/index.ts`; próby `tests/terrain-surface.test.ts` i `geography.test.ts`.

- [x] RED: dawny świadek skoku wysokości przy `x=-26.4470043033,z=0`; render i native muszą konsumować te same wierzchołki i indeksy.
- [x] Wprowadzić ciągłe składanie reliefu i `createTerrainSurface(source, ground)` zwracające `vertices: Float32Array`, `indices: Uint32Array`. `heightAt(0,0)` zachowuje dawny poziom tarasu; legacy funkcja pozostaje dostępna do migracji.
- [x] GREEN: ciągłość, dno cieków, niezerowa rzeźba i siedliska, zgodność projekcji. Nie przedstawiać samej ciągłości jako przyjętej naturalności.

### 3. Gracz i wspólne czynności

Pliki: `src/actors/actions.ts`, `src/actors/player.ts`, `src/session.ts`, `src/physics/index.ts`, `src/world/state.ts`; próby `tests/actors.test.ts` i `session.test.ts`.

- [x] RED: ruch gracza nie zostaje nadpisany przez brain; blokada, masa, podjęcie tej samej rzeczy i utrata chwytu są wspólne z NPC.
- [x] Wprowadzić osobne źródło kontroli i wspólne materialne próby podjęcia, odłożenia, jedzenia oraz odpoczynku. Efekt nie wynika z samego napisu w interfejsie. Odczyt zachowuje postać i czynność.
- [x] GREEN: rzeczywisty solver, ściana, pauza / utrata fokusu, odczyt, zasięg i odmowa zajętej rzeczy.

### 4. Możliwości dalszego życia

Pliki: `src/life/index.ts`, `src/world/resources.ts`, `src/world/state.ts`; próby `tests/life.test.ts`, `tests/living-continuity.test.ts`.

- [x] RED: mieszkańcy mogą znaleźć i zdobyć skończone jedzenie po zużyciu posiłku; usunięcie możliwości daje inne działanie lub uzasadniony spokój.
- [x] Dodać materialnie rozliczane lokalne zasoby i obserwowane możliwości sąsiedztwa; używać tego samego wykonania czynności. Znana mapa nie jest całą mapą. Wybrać jawny model odnowy lub skończoności, nie ukryty respawn.
- [x] GREEN: dłuższy bieg bez operatora, wyczerpana okolica, utrata dostępu, zachowanie rzeczywistego skutku w zapisie. Liczba zdarzeń nie kwalifikuje samodzielnego życia.

### 5. Kontakt z grą i dostarczenie

Pliki: `src/ui/*`, `src/view/index.ts`, `src/view/objects.ts`, `src/main.ts`; próby `tests/interface.test.ts`, `tests/player-controls.test.ts`.

- [x] RED: wejście / wyjście z tworzenia ma czytelny czas; formularz lub utrata fokusu nie zostawiają biegnącej postaci. Cofnięcie i anulowanie nie są restartem.
- [x] Połączyć postać, kamerę i bezpośredni edytor; wyraźny wybór, podgląd oraz lokalne liczby. Poprawić bliski ogląd i czytelność materialnych następstw.
- [x] Wykonać końcowy build i niezależny przegląd zmiany.
- [x] Dostarczyć tę samą prywatną grę; zachować publiczny kod i aktualny stan pracy.

## Sprawdziany przekrojowe

Następujące granice obowiązują wszystkie zadania: wybór gracza nie nadaje NPC wiedzy; usunięcie poznanej formy nie niszczy odczytu; cofnięcie po zjedzeniu nie odtwarza porcji; nowy collider nie wypycha zamkniętej w nim osoby; błąd odczytu lub przyjęcia nie podmienia historii; nie ma czasu bez wykonanych kroków. Przed publikacją sprawdzić puste poprawki, błędne liczby, utratę fokusu, współdzielony przedmiot oraz dawne zapisy.

## Stan wykonania

Początek: czysty kod pierwszej kampanii, 77 testów / 7 plików. Źródło prywatnej witryny otwarte i uzgodnione z checkoutem. Przeglądarka do lokalnego QA nie jest obecnie dostępna w zarządzanym środowisku Sites; nie obchodzimy tego osobnym serwerem. Ocenę użytkową odróżnimy od prób mechanicznych oraz publikacji.


Wykonano formy i zagnieżdżone układy, transakcję źródła/native, wycofywanie tożsamości również po cofnięciu tworzenia oraz zachowanie zapasu roślin po undo. Schema 2 zapisuje źródło bez konkurencyjnych cache; odczyt weryfikuje powiązania, liczby i kształty przed odbudową. Migracja zachowuje tę samą historię, spożycie, czas i wcześniejsze świadectwa.

Gracz korzysta z tego samego 80-kilogramowego ciała, ograniczonego napędu, chwytu i prób działania. Mieszkańcy zdobywają skończone owoce z widzianych roślin, jedzą, odpoczywają, spotykają się i ponownie rozglądają. Lokalna obserwacja może obalić dawną obecność miejsca lub przeszkody; usunięcie przez autora nie przekazuje tej wiedzy zdalnie.

Źródło reliefu otrzymało dwie poprawki: ciągłe składanie dolin i rosnący wpływ odległości, który zapobiega obniżaniu górnego potoku przez daleki odpływ. Stary kontrprzykład miał ponad 30 m pustki pod wodą; gęste próbkowanie odcinków daje teraz 1,25–2,75 m głębokości. Obraz i kontakt dzielą 271 867 wierzchołków / 543 289 trójkątów. Zachowano dawny poziom zamieszkanej polany.

Pełne sprawdzenie przed przeglądem: **125/125 testów, 17 plików**. Próba 20 minut wykonała 72 000 kroków native; zapas owoców po 5/10/15/20 minutach wyniósł 41/36/32/28 z początkowych 42. Radom i Mira mieli końcowy głód 0,50 / 0,58; odczyt nie przywrócił zapasu lub chleba. To ograniczony dowód dalszego miejscowego życia, nie kwalifikacja pełnej ekologii, pracy, kultury lub atrakcyjności rozgrywki. Nie ma jeszcze odnowy zasobów, a ostatnie wspomnienia są ograniczone do 96 rekordów.

Próby interfejsu obejmują kamerowy ruch, blur, pola edycji, wcześniejszą pauzę, E zbierz/zjedz, preview/accept/cancel, układ rodzica i undo po przeżytych skutkach. Niedostępny renderer WebGL zastąpiono wyłącznie na granicy UI; Session i native są rzeczywiste. **Nie wykonano przeglądarkowego grania lub kwalifikacji uchwytów, obrazu i mobilnego layoutu.** Bieżący cel po dostarczeniu: rzeczywisty ogląd oraz feedback, następnie rozwijanie materiału krainy i codziennych powodów jej mieszkańców, bez ochrony obecnych rozwiązań.


## Przegląd i poprawki przed publikacją

Niezależny przegląd zakresu pierwszego commita tej kampanii potwierdził trzy regresje: nadpisanie zapisanej postury gracza przy otwarciu, niewymienianie obrazu ziemi po odczycie innego zasięgu oraz brak zawijania lokalnego kąta gestu przez obróconego rodzica. Wszystkie mają próby, które odtworzyły błędne zachowanie, i poprawki. Naprawiono też własność miejsca „home”: marker domu jest lokalnym użyciem jego formy.

Projekcja krajobrazu przygotowuje nowe reprezentacje, wymienia je po zmianie zaakceptowanej reguły i zwalnia poprzednie zasoby. Zwykła zmiana formy lub liczby owoców nie przebudowuje ziemi. Drzewa i woda są ograniczone do przygotowanego zakresu. Niewspierana zmiana definicji cieków jest odrzucana przed podmianą historii; rozszerzenie zasięgu pozostaje możliwe w granicach obecnego wykonawcy.

**Końcowe sprawdzenie kodu: 134/134 testów, 18 plików; produkcyjny build zakończony.** Bundle JS ma około 1,80 MB / 0,54 MB gzip, dlatego przygotowanie i płynność rzeczywistego klienta nadal wymagają oglądu. Weryfikacja krajobrazu sprawdza prawdziwą geometrię Three.js, raycast, wspólne tablice i zwalnianie instancji; nie jest przeglądarkowym renderingiem.


## Dostarczenie i wznowienie

Publikacja 14.10.2026 zakończyła się `succeeded` pod dotychczasowym prywatnym adresem. Źródło gry: `5aa4c5306d253bea4499f5f5b5c087d760631e84`; publiczny commit kodu: `a3c9e4e134603a8ce2a429d1160a4a0e843c0790`. Obydwa miały to samo sprawdzone drzewo `de9e736ee9f0fd68cc05d32855b1b9f6cfb55851`. Zapisana wersja: `appgprj_6ace6975dd608191b9d7754d7c18b6a7~appgver_a1cbd521503c81918d37368a476f4fc3`.

Po publikacji otwarto rzeczywistą grę w Operze. Odczyt pokazał nowy interfejs, postać gracza i zegar; screenshot potwierdził render 3D z domem, postacią i HUD-em. To pierwszy ogląd wdrożenia, nie próba wszystkich uchwytów, pomiar FPS, test mobilny lub Owner PASS. Klient nadal wymaga rzeczywistego grania i krytyki jakości.

Kontynuacja ma zaczynać od tej działającej całości i aktualnego feedbacku. Nie powtarzać całego audytu ani odtwarzać skończonego zbioru. Najbliższy osąd dotyczy odczucia chodu/interakcji, kosztu swobodnego tworzenia oraz bogactwa lokalnego środowiska i własnych spraw mieszkańców. Obecny sześcioczęściowy zestaw form, proste potrzeby i wizualny las nie są docelowym poziomem Krainy. Nadrzędny brak immunitetu wszystkich fundamentów pozostaje w mocy.
