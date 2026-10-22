# MiniFeniks — luka między percepcją, sprawą i materialnym działaniem
2026-10-22 · izolowany research, bez zmian silnika i publikowanej gry

## Live truth (nie ocena życia)

**Owner correction:** obecne NPC MiniFeniksa są nudne, w większości nic nie robią; ich życie dopiero zaczynaliśmy tworzyć. Nie należy przestawiać tej oceny jako błędu Ownera tylko dlatego, że skromne pętle zapasów przechodzą testy. `PASS` jest statusem reprodukcji fizyki i świadectwa, nie kryterium wiarygodnego życia.

Badane źródło: `main` `cdc8acc104faff428751d413bc3d2136dde8c879`, izolowany draft PR #1. Badania obejmują rzeczywisty native Box3D z `createSession`, `createWorld` i istniejącym wyborem zamiaru. Nie zmieniono logiki NPC, assetów, publikowanego podglądu ani `main`.

## 1. Descriptive life baseline (zero operator jobs)

`tests/owner-life-baseline.test.ts`, [CI #39811511153](https://github.com/Jozzpoly/Mini_Feniks/actions/runs/39811511153), 10 minut czasu symulacji, 36 000 kroków solvera:

| Resident | Czas z zamiarem `quiet` | Czas ruchu > 0.14 m/s | Najdłuższa seria `quiet` | Wybrane działania materialne |
|---|---:|---:|---:|---|
| Mira | 86,1% | 12,4% | 257,5 s | 3 zbiory, 3 odłożenia, 1 jedzenie |
| Radom | 71,2% | 21,3% | 231,3 s | 3 zbiory, 4 odłożenia, 1 jedzenie |

Całe środkowe minuty bez ruchu; niewiele rzeczywistych kontaktów ze światem. To opis *jednej* krainy i punktu startowego. Spokój sam w sobie nie jest błędem, a ruch nie jest miarą życia. Te liczby potwierdzają tylko, że doświadczenie Ownera ma materialną podstawę.

## 2. A/B/C — zauważanie świata nie tworzy samo działania

`tests/owner-opportunity-gap.test.ts`; ten sam zapis z 120. sekundy, gdy Mira jest `quiet`, następne 120 sekund bez sterowania mieszkańcem. Nowe przedmioty B i C pojawiają się w ramach jawnej **diagnostycznej fixture**, a nie normalnego authoringu lub wejścia gracza.

| Arm | Interwencja | Quiet | Ruch | Zauważone nowe przedmioty | Użycia nowych materiałów |
|---|---|---:|---:|---:|---:|
| A | Nic | 100% | 0% | 0 | 0 |
| B | 3 materialne obiekty w pobliżu | 100% | 0% | **3/3** | 0 |
| C | Jak B + diagnostyczny silny głód (0.9) | 71,3% | 20,3% | **3/3** | 0 |

W C Mira uruchamia m.in. jedzenie i zbiór — system wykonania motywowanych działań nie jest generalnie wyłączony. A i B zaczęły z identycznym głodem 0.422. C jest **kontrolą czułości**, nie czystym A/B wpływu samych obiektów. Wynik oznacza wprost: mechanizm potrafi zobaczyć materiał, lecz nie uznaje go za treść własnej sprawy.

Finalne [CI #39815801244](https://github.com/Jozzpoly/Mini_Feniks/actions/runs/39815801244): 5/5 testów Vitest w czterech plikach + TypeScript PASS.

## 3. Co mówi kod

- `observeResident` zapisuje widziane części/rzeczy, ich pozycję, rozmiar, dostępność i to, że coś się zmieniło.
- `route` używa materialnych znanych przeszkód do doboru przejścia.
- `concernIntent` utrzymuje tylko rodzaj sprawy `provision`: skończona liczba porcji w zapamiętanym miejscu. Gdy zapas jest pełny, mechanizm wraca do innych potrzeb lub `quiet`.
- `chooseIntent` używa głodu, zmęczenia, spotkania i punktów obserwacyjnych; nie ma w nim powodu wykorzystania drewna, twórczości, materialnej naprawy, trwałej relacji lub własnego odkrycia.
- `executeAction` oferuje fizyczne podniesienie i odłożenie rzeczy, ale polityka NPC nie wybiera tego jako własnego materialnego przedsięwzięcia. Większość krajobrazu jest jeszcze wizualna; nie ma pełnej tożsamości materialnej i działania na zwykłym lesie.

Nie każde podniesienie nowej deski byłoby sensowne. Brak automatycznej reakcji na dowolną nowość **nie jest bugiem**; brak generowania istotnych dla konkretnej osoby powodów działania stanowi ograniczenie expressivity / możliwości.

## 4. Krzyżowa kontrola: konkretna pamięć nadal ma wartość

Wcześniejsze testy w tym PR [CI #39806420320](https://github.com/Jozzpoly/Mini_Feniks/actions/runs/39806420320) potwierdziły: kiedy gracz naturalnym napędem dochodzi po rzeczywistą porcję, bierze ją i wraca, Mira w dwóch startach (0 / +7m) fizycznie odtwarza zapas; wariant po save/load zachowuje skutek. Istnieje przyczynowa pętla bez telepatycznej wiedzy, ale wąska. Dwa światy o jednakowo pełnym zapasie mogły mieć inną historię pracy.

Negatywny marsz prosty (+7m) zatrzymał się 2.58m od porcji; fizyczne obejście stołu umożliwiło zabranie. Trzeba chronić ten FAIL: nie każdy dany cel jest osiągalny prostą trajektorią, nawet gdy czynność jest legalna przy właściwym podejściu.

## 5. Co zmienia decyzję o dalszej pracy

**Nie:** obniżaj progi głodu, dodawaj losowy spacer, licz więcej animacji, produkcję generycznych tasków, wymuszaj ciągłą aktywność, ogłaszaj życie na podstawie zielonych testów.

**Tak:** wybierz jedną sytuację, w której aktor ma własny, zrozumiały powód przeobrażenia świata — a nie tylko osiągnięcia licznika — i wynik może zmienić jego późniejsze możliwości. Przykładowe pytanie do przyszłego bounded prototypu (nie zlecenie): czy fizyczna przeszkoda przed ważnym miejscem skłania do *sensownej* reakcji (obejścia, przestawienia rzeczy, poproszenia kogoś o pomoc), zgodnej z prywatną wiedzą, siłą i bieżącą sprawą? Jak odróżnić ten mechanizm od jednego nowego skryptu na przeszkodę?

Kolejna bramka powinna zestawić:
1. Świat materialnie umożliwia działanie bez arbitralnej blokady;
2. Aktor ma osobisty powód i lokalną wiedzę o sytuacji;
3. Rezultat przekształca sytuację dalszych wyborów, również dla innych;
4. Obserwujący człowiek może zrozumieć sens zachowania bez czytania debug trace.

To **kryteria falsyfikacji eksperymentu**, nie definicja życia ani wymagania stałej architektury. MiniFeniks, Feniks i ReflexBrain pozostają autonomiczne. Gameplay, czytelność i wrażenie pobytu w świecie mają veto wobec nieskończonego rozbudowywania abstrakcyjnego brain.

## 6. Zewnętrzne punkty odniesienia (inspiracje, nie dowody naszych wyników)

- [Park i in., Generative Agents, UIST 2023](https://doi.org/10.1145/3586183.3606763): obserwacja, planowanie i refleksja mogą wspólnie zwiększać *believability* symulowanych agentów; nie dowodzą fizycznej obecności ani uniwersalnej jakości gry.
- [Agency From a Radical Embodied Standpoint, 2020](https://pubmed.ncbi.nlm.nih.gov/32670161/): użyteczny nacisk na relację organizm–środowisko i nawyki, nie gotowa architektura gry.
- [Towards origins of virtual artificial life, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12489504/): open-ended adaptation jest znacznie ambitniejszym kryterium niż skończony katalog tasków; to horizon badawczy, nie formalna kwalifikacja MiniFeniksa.

**Akceptowalny następny wynik może być negatywny.** Jeśli świecie brakuje materialnej możliwości, uczciwie uzasadnij ją przed dokładaniem nowego planera. Nie zamieniaj deklaracji w magiczne działanie.
