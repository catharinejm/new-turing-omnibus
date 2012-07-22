(ns ch1.wallpaper
  (:require [goog.graphics :as gfx]))

(def game-window (gfx/createGraphics 800 600))
(def stroke (gfx/Stroke. 0 "#FFF"))
(def fill (gfx/SolidFill. "black"))

(defn draw-point! [canvas x y]
  (.drawRect canvas x y 1 1 stroke fill))

(draw-point! game-window 10 10)
(draw-point! game-window 20 10)
(draw-point! game-window 30 10)

(set! js/window -onload
      #(.render game-window))
