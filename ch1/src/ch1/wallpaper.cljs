(ns ch1.wallpaper
  (:require [goog.graphics :as gfx]
            [goog.dom :as dom]
            goog.Uri))

(extend-type js/NodeList
  cljs.core.ISeqable
  (-seq [this] (doall (map #(.item this %)
                           (range (.-length this))))))

(def game-window (gfx/createGraphics 800 800))
(def stroke (gfx/Stroke. 0 "#FFF"))
(def fill (gfx/SolidFill. "black"))

(defn draw-point! [canvas x y]
  (.drawRect canvas (* 4 x) (* 4 y) 4 4 stroke fill))

(defn wallpaper! [canvas side]
  (.clear canvas)
  (dotimes [i 100]
    (let [x (* i (/ side 100))]
      (dotimes [j 100]
        (let [y (* j (/ side 100))]
          (when (even? (.floor js/Math (+ (* x x) (* y y))))
            (draw-point! canvas x y)))))))

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
        side (js/parseInt (:side inputs))]
    (when-not (nan? side)
      (wallpaper! canvas side))
    false))

(defn init-form [form-el]
  (let [query-data (.getQueryData (goog.Uri. (.. js/window -location -href)))
        param-names (.getKeys query-data)]
    (dorun
     (for [param param-names
           :let [input (.querySelector form-el (str "input[name=\"" param "\"]"))
                 value (first (.getValues query-data param))]
           :when input]
       (set! input -value value)))))

(set! js/window -onload
      (fn []
        (let [dimensions-form (dom/getElement "dimensions")]
          (set! dimensions-form -onsubmit
                (partial update-canvas game-window dimensions-form))
          (init-form dimensions-form)
          (.click (.querySelector dimensions-form "input[type=submit]"))
          (.render game-window))))