(ns ch1.wallpaper
  (:require [goog.graphics :as gfx]
            [goog.dom :as dom]
            goog.Uri))

(extend-type js/NodeList
  cljs.core.ISeqable
  (-seq [this] (doall (map #(.item this %)
                           (range (.-length this))))))

(def game-window (gfx/createGraphics 400 400 100 100))
(def stroke (gfx/Stroke. 0 "#FFF"))

(defn draw-point! [canvas x y color]
  (let [fill (gfx/SolidFill. color)]
    (.drawRect canvas x y 1 1 stroke fill)))

(defn wallpaper! [canvas side colors]
  (.clear canvas)
  (dotimes [i 100]
    (let [x (* i (/ side 100))]
      (dotimes [j 100]
        (let [y (* j (/ side 100))
              drw-idx (.floor js/Math
                              (rem (+ (* x x) (* y y))
                                   (inc (count colors))))]
          (when (contains? colors drw-idx)
            (draw-point! canvas i j (nth colors drw-idx))))))))

(defn serialize-inputs [form-el]
  (let [inputs (.querySelectorAll form-el "input")]
    (reduce (fn [m el]
              (let [el-name (.getAttribute el "name")
                    kname (keyword (re-find #"^[^\[]+" el-name))
                    value (.-value el)]
                (update-in m [kname]
                           #(if (= (name kname) el-name)
                              value
                              (conj (vec %) value)))))
            {} inputs)))

(defn nan? [x]
  (and (number? x) (not= x x)))

(defn update-canvas [canvas form-el event]
  (let [inputs (serialize-inputs form-el)
        side (js/parseInt (:side inputs))
        colors (filterv (comp not empty?) (:colors inputs))]
    (when-not (or (nan? side) (empty? colors))
      (wallpaper! canvas side colors))
    false))

(defn animate []
  (let [n (atom 0)]
    (js/setInterval
     (fn []
       (wallpaper! game-window @n ["black" "grey" "lightgrey"])
       (swap! n inc))
     200)))

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