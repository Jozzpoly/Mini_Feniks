# Źródła i nauka z donorów

13.10.2026 · wybrane publiczne źródła · odczyt kodu, bez nowej kwalifikacji gry

Donory dostarczają konkretnych podkompetencji i doświadczeń. Przenoszony mechanizm otrzymuje nową ocenę w kontekście Krainy. Poniższe piny nie są deklaracją najnowszego zdalnego HEAD, wdrożenia lub Owner PASS MiniFeniksa.

## Character i chwyt 3D

[Box3d-Character-Controler — pin e7a98be](https://github.com/Jozzpoly/Box3d-Character-Controler/tree/e7a98beaca4c010e056c31db97b33c05b4610e38)

- [src/donor/index.js](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/src/donor/index.js): factory V1 i cykl `preStep → world step → postStep`.
- [src/character.js](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/src/character.js): analityczna kapsuła, stan własny i ręczna reakcja kontaktu; konstruktor nie rejestruje native body/shape mieszkańca.
- [src/e19/dual-grip-actuator.js](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/src/e19/dual-grip-actuator.js) i [dual-grip-relative-kernel.js](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/src/e19/dual-grip-relative-kernel.js): operator chwytu, bezwładność trzymanej rzeczy i przeciwna zmiana prędkości punktowej masy nosiciela. Domyślne limity są nieskończone.
- [package.json](https://github.com/Jozzpoly/Box3d-Character-Controler/blob/e7a98beaca4c010e056c31db97b33c05b4610e38/package.json): wiązanie `box3d.js` 0.1.1.

Przydatne: źródło zachowania lokomocji, zapytań podparcia, matematyki i wcześniejszych falsyfikatorów. Granica: wiele zwykłych V1 nie ustanawia kontaktu wielu osób; E19 nie kwalifikuje chwytu dwóch native ciał, naszego chodu, schodów, postur lub żywego odczytu. Decyzja native-first w `FOUNDATION.md` jest nowym rozwiązaniem do sprawdzenia.

## JV — reprezentacje, zasoby i czas

[JV-Box3D-Web-experiment — pin 5c3830c](https://github.com/Jozzpoly/JV-Box3D-Web-experiment/tree/5c3830c01d58e42fb9b3705ff9948bdbe6071659)

- [src/scene/jv-world-physics.ts](https://github.com/Jozzpoly/JV-Box3D-Web-experiment/blob/5c3830c01d58e42fb9b3705ff9948bdbe6071659/src/scene/jv-world-physics.ts): statyczna instalacja brył/meshy i właściciel zasobów. Meshe używają `Float32Array`; nie wynika stąd kwalifikacja precyzji całego przyszłego regionu. Zwolnienie po zniszczeniu świata nie kwalifikuje lokalnej żywej wymiany.
- [src/core/fixed-step-clock.ts](https://github.com/Jozzpoly/JV-Box3D-Web-experiment/blob/5c3830c01d58e42fb9b3705ff9948bdbe6071659/src/core/fixed-step-clock.ts): clamp/drop może przesunąć `simulationTimeMs` bez wykonania `onStep`. Nie dziedziczymy tej semantyki jako pauzy życia.

Przydatne są ograniczone wzory własności i oddzielenia reprezentacji. Installer nie dostarcza kontraktu rewizji, zapisu i prywatnej ciągłości mieszkańców.

## ReflexBrain — obserwacja musi prowadzić wybór

[Living A — pin cb03fcd](https://github.com/Jozzpoly/ReflexBrain-Lab/tree/cb03fcd1ca668baac36e87e90252514ba40179af), [src/living-organism/runtime.ts](https://github.com/Jozzpoly/ReflexBrain-Lab/blob/cb03fcd1ca668baac36e87e90252514ba40179af/src/living-organism/runtime.ts).

W tej ścieżce wykonywane jest `vision.observe(frame)`, ale `occupant.decide(frame)` nie otrzymuje wyniku estymacji PrivateVision. To wąska granica konkretnego snapshotu; nie oznacza, że cała pamięć Occupant jest nieczynna. Instrumentacja albo wynik probe nie dowodzi wpływu na działającego mieszkańca. Nowe uczenie lub poznawanie musi rzeczywiście zmieniać właściwy wybór/wykonanie i przejść próbę swojego zakresu.

## Naturalność i własne kształtowanie

[Génevaux i współautorzy, 2013 — opis autora](https://perso.liris.cnrs.fr/apeytavi/website/publication/hal-01339224/) wskazuje konstrukcję sieci odpływu i zlewni przed składaniem form terenu. Sprawdzono opis i abstrakt; pełny PDF nie był dostępny. To inspiracja porządku zależności, nie przyjęty generator lub kwalifikacja naturalności MiniFeniksa.

Wcześniejsze rozpoznanie portfolio obejmowało także własne formy, source/revision, lokalne dirty regions i ciągłość tożsamości. Nie przenosimy automatycznie ich siatek, tokenów runtime'u lub historii klonowanych całych scen do wielkiej Krainy. Konkretny transfer będzie opisany przy kodzie, gdy zacznie wykonywać potrzebną kompetencję.

Powyższe źródła służą decyzjom. Nie zaimportowano ich kodu, assetów, zależności lub dawnych testów do MiniFeniksa.
