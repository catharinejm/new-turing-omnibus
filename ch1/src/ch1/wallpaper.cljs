(ns ch1.wallpaper
  (:require [goog.graphics :as gfx]
            [goog.dom :as dom]))

(extend-type js/NodeList
  cljs.core.ISeqable
  (-seq [this] (doall (map #(.item this %)
                           (range (.-length this))))))

(def game-window (gfx/createGraphics 800 600))
(def stroke (gfx/Stroke. 0 "#FFF"))
(def fill (gfx/SolidFill. "black"))

(defn draw-point! [canvas x y]
  (.drawRect canvas x y 1 1 stroke fill))

(defn wallpaper! [canvas corna cornb side]
  (dotimes [i 100]
    (dotimes [j 100]
      (let [x (+ i 8)
            y (+ j 6)]
        (when (even? (+ (* x x) (* y y)))
          (draw-point! canvas i j))))))

(defn serialize-inputs [form-el]
  (let [inputs (.querySelectorAll form-el "input")]
    (reduce (fn [m el]
              (assoc m
                (keyword (.getAttribute el "name"))
                (.-value el)))
            {} inputs)))

(defn nan? [x]
  (and (number? x) (not= x x)))

(defn update-canvas [canvas form-el event]
  (let [inputs (serialize-inputs form-el)
        int-inputs (map (comp js/parseInt inputs) [:corna :cornb :side])]
    (if (some nan? int-inputs)
      (js/alert "ETNER SOME NUMMAS")
      (apply wallpaper! canvas int-inputs))
    false))

(set! js/window -onload
      (fn []
        (let [dimensions-form (dom/getElement "dimensions")]
          (set! dimensions-form -onsubmit
                (partial update-canvas game-window dimensions-form))
          (.render game-window))))
