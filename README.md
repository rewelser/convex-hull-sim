# convex-hull-sim
#### A web-based sim for finding the convex hull of a plot of points
*Latest release: v1.1*

With this app you can create simple plots of points on a grid and determine the convex hull of those points. Once found, you can prune the points not on the hull.

Other tools are also available, such as:
* avg slope - displays the mean of all point pair slopes (n-choose-2 permutations)
* contour scan - populates list (RHS) and matrix (bottom) of the vertical and horizontal line scans of point pairs, where the scan pairs the two outermost points of the scan together. Horizontal pairs are orange, vertical are green. 
    * Hovering these pairings will highlight the points on the grid.
    * The matrix of contour scan pairs can be copied to clipboard ("copy as CSV" button)
* clear - empties the grid of all points
* other shapes - certain shapes can be automatically added without having to re-plot them after every clear.
