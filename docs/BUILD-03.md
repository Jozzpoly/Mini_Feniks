# Ponowna próba — 16.10.2026

Owner ponownie wymaga krytycznej oceny i dopuszcza duże zmiany. Obowiązuje zgoda na budowę oraz brak immunitetu fundamentów. Ten zapis zachowuje konkretne kontrprzykłady i następny kierunek; nie ratyfikuje obecnej architektury.

## Fakty, które zmieniają decyzję

**Autorstwo.** W rzeczywistym Chrome wejście w Twórz wybiera ławę i przybliża jej obszar, lecz nieprzezroczysty dach całkowicie ją zasłania. Widoczne są uchwyty, nie rzecz. Poprzedni test wymagał pełnej nieprzezroczystości w trybie autora, więc chronił wadliwe zachowanie. To regresja po poprawce kamery, nie nowy feedback Ownera.

Poprawka korzysta z obecnego przekroju rzeczywistych części: przedmiotem oglądu są granice zaznaczenia lub jego aktualnego podglądu. Części całego zaznaczonego poddrzewa są wyłączone z przecinania. Ława pozostaje pełna, a przesłaniający dach otrzymuje tymczasowe materiały. Wybranie całego domu przywraca również jego dach i wyposażenie. Podgląd zachowuje własną dotychczasową przezroczystość; kamera nie dodaje mu kolejnego wygaszenia. Źródło, zapis, kontakt i wiedza mieszkańców pozostają nietknięte.

**Dojścia.** W native próbie izolującej jeden kontroler, bez domu, przedmiotów, innych osób i braina, cel `[-16,24]` z `[-9,8]` przy żądaniu 1,2 m/s po 90 s pozostaje odległy o **5,280 m**. Ten sam kontroler na dawnym profilu dochodzi na **0,302 m**. Przeprowadzenie przez dwa pośrednie punkty nie rozwiązuje problemu: pozostaje **5,890 m**. Gdy na obecnym terenie użyto rzeczywistego `ControllerOwnedCharacter` V1 z donora Character, pozostało **0,300 m**. To wykonane porównanie, nie obietnica dokumentacji donora. Nie kwalifikuje V1 jako zamiennika: jego własne analityczne ciało nie zapewnia obecnego kontaktu wielu native osób i wzajemności obciążeń.

Przejście zachowanego poziomu polany w nowy relief jest za ciasne. Dla `x=-12`, między `z=14` i `z=24` ziemia rośnie z **128,584** do **138,257 m**; miejscami nachylenie przekracza 50°. Ciągłość funkcji i zgodność obrazu z kontaktem nie dowodzą naturalności lub sensownego dojścia. Obecne podparcie napędu używa dwóch krótkich promieni i progu normalnej Y=0,6. Przyszłe wykonanie musi lepiej traktować podłoże i kierunek ruchu. Próby innych stron dowodzą jednak, że świat nie jest globalnie nieprzechodni.

`scripts/probe-approaches.ts` zachowuje powtarzalną próbę obecnego wykonawcy z dawnym profilem jako kontrolą. Celowo pomija życie i elementy domu; nie jest zapisem gry ani testem naturalności całej mapy. Pełne porównanie V1 wykonano oddzielnie na przypiętym donorze opisanym w SOURCES; nie skopiowano jego kodu.

**Życie.** `life/index.ts` wybiera między progami potrzeb, krótkimi cooldownami i natychmiastowymi czynnościami. Brakuje trwałej własnej sprawy z materialnym postępem, powodem i konsekwencją przerwania. Trzymana porcja zawsze wywołuje zamiar zjedzenia, nawet przy niskim głodzie. Pozdrowienie jednostronnie zmniejsza potrzeby obu osób bez ich odrębnej odpowiedzi. Zbiór i posiłek są atomowymi skutkami decyzji. Produkcyjny wybór działa co 0,25 s; próby wywołujące samo `stepLife` częściej nie mierzą produkcyjnego czasu działania.

Mieszkaniec oscylujący na zboczu może nie spełnić obecnego `blockedFor`: mierzy ono bardzo małą prędkość, a nie postęp ku celowi. Następnie przekroczenie progu zmęczenia wyłącza wędrówkę, a ogólne „nic mnie nie przynagla” zaciera niedoszłe dojście. Powiększenie zbioru celów lub opisów tego nie naprawi.

## Osąd prowadzącego i następny spójny przyrost

Nie rozbudowywać obecnego generatora, enumów potrzeb i zestawu pudełkowych form jako trzech niezależnych produktów. Rozwinąć **jedno rzeczywiste miejsce życia i jego dojścia**, widoczne z poziomu gracza i możliwe do autorskiego przekształcania, z zachowaniem rozległej krainy.

1. Przekomponować przejście zamieszkanej polany w otoczenie razem z kwalifikacją lokomocji: stok, przejście przez próg, niesienie, spotkanie drugiej osoby, przerwanie i powrót. Nie przywracać całego dawnego generatora ani zwiększać siły, aby ukryć nieadekwatne podparcie. Zmiana ziemi wymaga jawnej decyzji o ciągłości zapisu; nie wciskać nowej geometrii pod dawną wersję terenu.
2. Dać mieszkańcowi pierwszą własną sprawę z materialnym wynikiem, np. przygotowanie zapasu/posiłku. Miejsce i rzeczy mają prowadzić wybór, a zebranie, niesienie, odłożenie i jedzenie zajmować rzeczywisty czas. Interwencja gracza lub autora powinna wymuszać lokalne odkrycie zmiany i sensowną kontynuację, zmianę albo porzucenie sprawy. To kandydat do przebudowy, nie zatwierdzony scenariusz osady lub całej gospodarki.
3. Sprawdzać ten sam przyrost w zwykłym graniu i tworzeniu. Czy widać co się dzieje, czy można coś zmienić i czy zmiana ma rzeczywisty skutek? Ładniejszy kadr oraz nowa nazwa celu nie wystarczą.

W donorze Llm-Live-NPC warto odzyskać kompetencję zachowania związku sprawy z jej materialnym wynikiem i osobną decyzję odbiorcy. Sam zapis innego uzasadnienia bez innego wykonania pozostaje negatywną nauką. Nie podłączamy modeli ani nie budujemy uniwersalnego frameworka tylko po to, by uzyskać kolejny pozór głębi.

## Sprawdzenie bieżącej poprawki

Regresję autora odtworzono najpierw nieprzechodzącą próbą rzeczywistego UI i geometrii, następnie zmieniono wykonanie. Test obejmuje odsłoniętą i wybieralną ławę, zachowaną nieprzezroczystość, przeniesiony podgląd, anulowanie, pełny wybrany dom i niezmieniony zapis. Niezależny przegląd nie znalazł konkretnego defektu w poprawce; wykonuje ograniczone sprawdzenia kodu, nie zastępuje obrazu GPU lub oceny Ownera.

Przeglądarka była zatrzymana w 10 s świata. Nie przyjęto zmian materialnych, nie resetowano historii ani nie otwarto drugiej karty tego samego originu. Próba eksportu pliku nie dostarczyła potwierdzonego pliku w narzędziu — nie traktujemy jej jako udanej kopii zapasowej. Oddzielny zarządzany podgląd był blokowany przez środowisko; nie zmieniono gry, aby obchodzić blokadę.
