# Pierwsza kampania budowy

13.10.2026 · implementacja zatwierdzona przez Ownera · specyfikacja: FOUNDATION.md

**Cel:** uruchomić jedną rozległą krainę z zamieszkanym miejscem, rzeczywistą materialnością, lokalnym autorstwem i trwałą ciągłością. Pierwszy działający przyrost ma być dostępny do oglądu przed pełną dojrzałością systemów.

**Architektura:** TypeScript, Three.js i Box3D 0.1.1; geograficzne metry, jeden stały krok i zakończony stan. Źródło miejsca, historia instancji, prywatna pamięć oraz reprezentacje fizyki pozostają rozdzielone. Jedna prowadząca integracja, niezależne zakresy z przypisanymi plikami.

## Wykonanie

- [ ] Stan i historia (`src/world/types.ts`, `state.ts`, `checkpoint.ts`, `revisions.ts`): trwałe ID, zmiana tylko wskazanego zakresu, odrzucenie zajętej geometrii, zapis/odczyt bez resetowania ludzi i rzeczy. Test przed implementacją: odłożona rzecz i lokalna pamięć przetrwają odczyt; odrzucona poprawka nie mutuje stanu.
- [ ] Geografia i obraz (`src/world/geography.ts`, `source.ts`, `src/view/*`): jeden własny region, spójny odpływ, różne siedliska, zbudowany z części dom, bliski i daleki ogląd. Testy kierunku odpływu, skali i możliwości przekształcenia własnej formy; geometria jest źródłem obrazu i kolizji.
- [ ] Materialne wykonanie (`src/physics/*`): dynamiczne ciała mieszkańców i rzeczy, skończony napęd, reakcja podpory, chwyt, bezpieczne odłożenie. Testy dwóch ludzi, przeszkody, masy i schodu rzeczywistego wejścia. Odpoczynek nie otrzymuje PASS za sam ruch animacji.
- [ ] Własne życie (`src/life/*`): wybór z potrzeb, preferencji i miejscowej wiedzy; brak nowego globalnego poznania z edycji. Zmęczenie po wykonaniu, odzyskiwanie sił w odpoczynku, skończona porcja, spokojny czas. Testy wpływu istotnej obserwacji, odmowy oraz dalszego wyboru bez zlecenia operatora.
- [ ] Integracja (`src/main.ts`, `src/ui/*`): sterowanie oglądem, wybór osoby/rzeczy, pauza, zapis/odczyt, edycja tej samej formy. Testy zakończonego czasu, round-trip aktywnego stanu i rzeczywistych controls. Build oraz ogląd wyrenderowanego wyniku, jeśli dostępny; żadnego Owner PASS przed feedbackiem.

## Pierwszy wykonany stan

Stan/historia, geografia/obraz, fizyka, poznanie/wybór i interfejs są już połączone w jeden runtime. Nie są pięcioma oddzielnymi produktami. Działający zakres obejmuje native przejście sześciu stopni wejścia, niesienie/odłożenie tej samej torby, niski odpoczynek/wstawanie, rzeczywisty dostęp do posiłku, dalszy wybór i lokalną zmianę istniejącej bryły.

Przegląd wyłapał i sprawdzenia odtworzyły: nieosiągalny środek jedzenia na stole, odbity znak obrotu w poznaniu, nadpisywanie zapisu świeżym światem po otwarciu oraz fałszywy sufit z broad-phase terenu. Poprawki mają regresje. Odczyt nie wykonuje obserwacji ani nie aktualizuje pamięci przed wznowieniem czasu. Zapis zawiera wersję reguły geografii; niewspierana reguła zatrzymuje odczyt bez niszczenia historii.

Przed publikacją niezależny przegląd odtworzył jeszcze import pustego świata zastępujący historię przed błędem interfejsu oraz nieobsługiwany wybór rzeczy. Zapis bez mieszkańców jest teraz jawnie niewspierany i odrzucany przed podmianą; kliknięcie rzeczy pokazuje jej aktualny stan. Oba przypadki otrzymały regresje i ponowny przegląd.

Sprawdzenia 13.10.2026: **77 testów w 7 plikach**, w tym rzeczywisty native solver i interfejs połączony z sesją. TypeScript oraz produkcyjny build przechodzą. Build ostrzega o dużym pakiecie JS; koszt na komputerze gracza pozostaje do pomiaru. Interfejs sprawdzony w JSDOM nie jest dowodem jakości WebGL.

Granice: edytujemy położenie, wymiary i obrót istniejących części; swobodne tworzenie/złożone formy pozostają do rozwinięcia. Las/woda są głównie obrazem, dach ma konserwatywną bryłę kolizji, sylwetki i ruch wymagają dalszej pracy. Wirtualne nogi i blokada pochylenia są jawną idealizacją. Nie uznano prostego odpoczynku za fizyczny siad na ławie. Mieszkańcy nie mają jeszcze bogatej gospodarki, uczenia lub pełnego dnia życia.

Kolejny ruch wynika z oglądu tej samej krainy: usunąć praktyczne słabości obrazu/ruchu, rozwinąć własne formy i przyczyny dalszego życia. Przejście testów nie zamyka tej kampanii ani nie zastępuje feedbacku Ownera.

## Kontrakty

Wspólne typy są w `src/world/types.ts`. Geografia daje wysokość i cieki, source daje jawne części i ID. Physics przyjmuje intencję prędkości, krok i chwyt; zapis zawiera dane semantyczne, nie native handles. Brain czyta prywatne obserwacje zakończonego kroku. Renderer tylko czyta stan. Rewizja następuje na granicy kroku, bez wykonania solvera pomiędzy starym i nowym kształtem.

## Ryzyka do weryfikacji

Schody i postury są nową kompetencją. Zmiana kapsuły usuwa kontakty. Odtworzenie kończy kształty/masę przed transformem i prędkościami. Zmiana layoutu lub kamery nie wykonuje czasu. Powiększanie świata zachowuje ID i istniejące ślady. Udane testy nie kwalifikują piękna, jakości ruchu lub doświadczenia Ownera.

Plan rozwija tę samą krainę; korygujemy go wobec rzeczywistych wyników i odnotowujemy pozostałe braki. Nie zamykamy pracy po samym uruchomieniu projektu.

## Przekazanie pierwszego przyrostu

Pierwsza wersja została opublikowana 13.10.2026 pod [prywatnym adresem krainy](https://mini-feniks-zywa-kraina.sweetcrane512.chatgpt.site); źródła gry są na głównej gałęzi repozytorium. Zgodność całego drzewa plików z wdrożonym źródłem została sprawdzona. Ogląd w przeglądarce doszedł do wyboru konta ChatGPT; nie uznano tego za sprawdzenie renderingu, wydajności ani doświadczenia gry.

Do wznowienia: zacząć od rzeczywistego oglądu bliskiego domu i dalekiej krainy, czytelności ludzi i działania kontroli. Nie dodawać systemów przed rozpoznaniem widocznych słabości. Następnie rozwijać tę samą całość: realne tworzenie własnych form, materialne otoczenie i dalsze własne powody mieszkańców. Lista wcześniejszych zadań pozostaje kryterium kwalifikacji; sam obecny runtime nie spełnia całej wizji.

## Ocena po pierwszym graniu

13.10.2026 · pierwszy rzeczywisty ogląd i korekta kierunku · **dalsza implementacja wstrzymana**

Owner potwierdził wartość pierwszego przyrostu i tempo wykonania, jednocześnie zgłaszając pustkę, szybkie wygasanie życia, nieczytelny upływ czasu oraz bardzo słabe edytowanie. Nie przyjęto jakości doświadczenia gry. Nowa potwierdzona intencja: **gracz ma być pełnoprawnym aktorem tej samej krainy**. Nie przesądza to kamery, tożsamości jego postaci lub kultury wspólnoty.

Przeanalizowano nagranie 2:21 przez próbki co 4 sekundy i dokładne klatki istotnych interakcji, trzy dodatkowe obrazy, bieżący widok i odczyt interfejsu w Operze, rzeczywisty kod oraz wcześniejszy sposób budowy. Dwa niezależne odczyty zbadały życie/ciągłość i autorstwo/aktorów. Diagnozy wykonały niezmienione funkcje i native sesję, bez nowych funkcji lub testów gry. Źródło implementacji odpowiada commitowi `0a1e6e2`; późniejsze zmiany do tej oceny były dokumentacyjne. Nagrania i prywatnych materiałów nie kopiujemy do publicznego repozytorium.

### Co pokazuje granie

| Materiał | Obserwacja | Znaczenie |
| --- | --- | --- |
| Nagranie, około 0–54 s | Ogląd domu i dwóch przeważnie nieruchomych osób; torba jest już odłożona. Kamera jest główną dostępną aktywnością. | Spójność podsystemów nie daje jeszcze bogatego pierwszego kontaktu. |
| Nagranie, około 54–98 s | Wybór ściany/nogi ławy i poprawki liczbowe; komunikat przyjęcia bez wskazania części i podglądu zakresu zmiany. | Autor nie otrzymuje czytelnej kontroli nad kompozycją. |
| Nagranie po wejściu w edytor | Przycisk zmienia się na „Wznów”; pauza pozostaje również po powrocie do inspektora. | Część obserwowanej bezczynności przypada na zatrzymany czas. Nie wyjaśnia to strukturalnego wyczerpywania życia. |
| Obrazy i bieżący odczyt Opery | Nakładka witryny zasłania mały zegar; odczyt zawiera „Pauza · 2:12 · 2 mieszkańców”. Wybrana Mira może pozostawać poza głównym widokiem, w którym dominuje Radom. | Upływ czasu, wskazanie osoby i związek opisu z obrazem są słabo czytelne. |
| Obraz rozległej krainy | Widoczny zasięg istnieje; wiele przyrody jest instancjonowaną dekoracją, a bliskie życie ma bardzo mało użytecznych rzeczy i możliwości. | Mały teren użytkowany przez wspólnotę jest zgodny z wizją. Jego ubóstwo znaczeń nie wynika z wymagania małej wspólnoty. |

Nie zmierzono FPS na komputerze gracza ani nie wykazano konkretnej awarii zegara w jego przeglądarce. Obraz podłoża, sylwetki, materiały i kamera są teraz faktycznie widziane, lecz pozostają do doskonalenia.

### Dlaczego życie wygasa

Odtworzenie świeżego świata przez 1200 sekund / 72000 native kroków zachowało biegnący czas. Radom odłożył torbę około 7 s; Mira zjadła jedyną porcję w 145,5 s. Później aktywność składała się głównie ze spokojnego oczekiwania i cykli zmęczenia/odpoczynku. Przy 900 s obie osoby miały głód 1. Zapis/odczyt zachował ten stan. To diagnoza mechanizmu; nie odtworzenie dokładnego zapisu Ownera.

- `src/life/index.ts`: wędrówka wymaga ciekawości ponad .35; dotarcie odejmuje .22, nic jej nie odnawia. Radom zaczyna z .32, Mira po dwóch odwiedzinach schodzi z .68 do .24. Dalsze miejsce nie zostaje poznane z pobliskiego punktu; brak poszukiwania nieznanej drogi.
- `src/world/state.ts` i `life`: jedna skończona porcja zostaje zużyta. Brak zdobywania, przetwarzania lub dzielenia żywności. Skończoność zasobu jest prawidłowa; dalsze możliwości są niezaimplementowane.
- `sociability` jest przechowywane, ale nie uczestniczy w działaniu. Brak spotkań, pracy, podjęcia odłożonej rzeczy i rzeczywistych zobowiązań. Początkowy chwyt jest nadany, nie osiągany czynnością.
- Wydłużone spokojne oczekiwanie w odtworzeniu miało `blockedFor=0`. Nie należy każdej bezczynności przypisywać zatorowi. Spokój i odmowa pozostają potrzebne, ale obecnie katalog możliwości systematycznie się wyczerpuje.

### Autorstwo oraz używanie tej samej formy

`PartSource` i `Place` są osobnymi rekordami w absolutnych współrzędnych. Przyjęta zmiana ławy na (-18, 8) pozostawia miejsce odpoczynku na (-2.9, -1) oraz jej nogi w dawnych położeniach. Stół, odkładanie i posiłek mają podobne niezależne punkty. Obserwacja może poznać nową bryłę, a używanie nadal wskazywać stare miejsce. Niska postura jest obecnie odpoczynkiem przy punkcie na podłodze; nazwa „ulubiona ławka” nie ustanawia fizycznego siadu.

Edytor zmienia pojedyncze prymitywy. Nie ma kompozycji, lokalnych układów, grup, tworzenia/usuwania, materiałów, podglądu, nazwanego cofnięcia ani wskazania aktualnego użycia. Powtarzane etykiety utrudniają wybór. Wysokość mebla około 129 m odsłania regionalną współrzędną zamiast użytecznej relacji do podłogi. Przyjęcie wszystkich pól zaokrąglonych do dwóch cyfr może zmienić również nietknięte dane; brak rozpoznania pustej poprawki. Sam gizmo nie rozwiąże tych zależności.

Potrzebne są formy i części z relacjami oraz jawnie powiązane powierzchnie/miejsca używania: co podąża za zmianą, co traci możliwość użycia, co pozostaje niezależne. Przyjęcie przebudowy musi zachować materialne skutki i prywatne przekonania. Usunięcie części nie może globalnie wymazać wspomnień; obecny validator wymagający istnienia wszystkich znanych ID wymaga rozszerzenia. Cofnięcie formy nie cofa przeżytego czasu.

### Geografia i zgodność podłoża

Niezależnie od zgłoszonego ubóstwa znaleziono nieciągłość `heightAt`. `drainageAt` wybiera najbliższy ciek/odcinek; jego poziom wody i szerokość wchodzą bez ciągłego uzgodnienia do całego reliefu. W pobliżu z=0, x=-26.4470043033 wysokości po dwóch stronach granicy, oddalonych o .002 m, wynoszą około 145.13829 i 136.99894 m. Zmniejszenie odstępu do .000002 m nadal daje różnicę około 8.13880 m. Istnieją także większe odległe granice.

To **nieciągłość funkcji źródłowej**, nie dowód fizycznej skarpy szerokiej na 2 mm. Obraz i native mesh rozciągają zmianę przez różne trójkąty. Obliczenia ich aktualnych powierzchni w tym samym miejscu dają rozbieżność około 1.94 m. Są to obliczenia geometrii, bez native raycastu w tym punkcie lub próby przejścia gracza. Dotychczasowe testy spadku cieków i dna pod wodą nie sprawdzały ciągłości reliefu ani zgodności pod stopami.

Naturalność oraz podłoże dostępne osobie wymagają poprawy reguły i jej reprezentacji. Dodanie ozdób lub powiększenie regionu nie rozwiązuje tego problemu. Zmiana geografii i formatu ma jawnie potraktować istniejący zapis; nie wolno po cichu zastąpić go świeżym światem.

### Pełnoprawny gracz i wspólne czynności

Wartościowym punktem zaczepienia jest wspólny native wykonawca ciała oraz mapy według trwałych ID. Obecnie `stepLife` narzuca jednak napęd wszystkim mieszkańcom co .25 s. Brak osobnego źródła kontroli dla gracza. Dodanie równoległego sterowania pozycją konkurowałoby z obecnym właścicielem ciała.

Skutki czynności są rozdzielone: jedzenie i odpoczynek zmienia brain, odłożenie uruchamia Session, zwolnienie chwytu wykonuje physics. Brak wspólnego kontraktu próby, postępu, przerwania i wyniku. Gracz oraz mieszkańcy powinni korzystać z tych samych materialnie sprawdzanych możliwości; różni się źródło zamiaru. Zasięg, dostęp, trzymanie, masa i skończony zasób pozostają faktami wspólnego świata. Własność rzeczy jest odrębna od fizycznego chwytu. Bogatszy brain ma wybierać wśród rzeczywistych możliwości, a nie omijać ich braki.

Swobodne autorstwo zmienia kompozycję przez osobne uprawnienie. Działanie postaci jest ograniczone jej ciałem, wiedzą i sytuacją. Obie drogi mają następstwa w tej samej historii; kamera i układ paneli nie wykonują życia. Forma uczestnictwa i poziom wglądu autora pozostają otwarte.

### Osąd kierunku i pracy

Rozmowa stopniowo przesunęła środek ciężkości od organizmu w laboratorium ku jednej szerokiej krainie, autorskiemu tworzeniu i samodzielnemu życiu. Kolejne korekty odrzucały ciasną celę, dekoracyjny dom, kopiowanie donorów i produkcję wariantów. Pierwszy przyrost spełnił część materialnych i technicznych warunków; duża panorama nadal otacza bardzo ograniczony świat znaczeń i działań.

Wcześniejszy projekt już ostrzegał przed wyczerpaniem początkowych spraw i samą edycją parametrów. Pierwsza kampania nie zrealizowała jeszcze tych związków. Test nazwany „continues from its own needs” sprawdzał torbę, wspomnienie odpoczynku i odczyt; nie wykazywał trwałości życia. 77 testów ma użyteczny zakres podkompetencji, ale nie ustanawia jakości całości. Przy kolejnej budowie dowody muszą odpowiadać temu, co faktycznie żyje i tworzy Owner.

**Zachować:** stabilne ID, tożsamość względem reprezentacji, jeden zakończony krok, native kontakt z ograniczonym napędem, wzajemny chwyt, lokalną pamięć, zachowywanie zużycia i skutków oraz jawne rewizje. **Przeprojektować:** założenia jednej chaty, relacje części/użyć, reprezentację geografii, wspólne czynności aktorów, powstawanie dalszych możliwości i bezpośrednie autorstwo. Nie ma obecnie dowodu uzasadniającego zmianę renderera lub solvera jako pierwszego ruchu.

Najbliższa praca przygotowawcza ma konkretnie uzgodnić te relacje na tej samej krainie i opisać spójny pierwszy kontakt gracza. Wartość przyszłego przyrostu rozpoznamy po swobodnej zmianie miejsca, materialnym uczestnictwie, własnych reakcjach mieszkańców, czytelnym czasie i dalszym życiu. Nie wymaga to uniwersalnego silnika, pełnej ekonomii albo osobnych konkurencyjnych gier. **Na tym etapie nie rozpoczęto dalszej implementacji ani nie zmieniono wdrożenia.**
