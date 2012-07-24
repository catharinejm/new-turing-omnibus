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

(defn build-frame [side colors]
  (let [side (/ side 100)
        clr-size (inc (count colors))]
    (vec
     (doall
      (for [i (range 100)
            j (range 100)
            :let [x (* i side)
                  y (* j side)
                  drw-idx (.floor js/Math
                                  (rem (+ (* x x) (* y y)) clr-size))]]
        (if (< drw-idx (count colors))
          (nth colors drw-idx)))))))

(defn draw-frame [canvas frame]
  (.clear canvas)
  (doseq [i (range 100)
          j (range 100)
          :let [color-idx (+ j (* i 100))
                color (nth frame color-idx)]]
    (if color
      (draw-point! canvas i j color))))

(defn wallpaper! [canvas side colors]
  (draw-frame canvas (build-frame side colors)))

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
  (let [frames (mapv #(build-frame % ["black"]) (range 200))
        n (atom 0)]
    (js/setInterval
     (fn []
       (draw-frame game-window (nth frames @n))
       (swap! n #(rem (inc %) (count frames))))
     100)))

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
          (set! (.querySelector dimensions-form "input[name=animate]") -onclick animate)
          (.render game-window))))