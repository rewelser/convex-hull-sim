// http://www.aforgenet.com/articles/shape_checker/
// Imagine an algorithm that fills an array with points that map
// to points on a 2D array, by recognizing that the points on the
// 2D array have similar color values. Then there should be a function
// to take that array and find the possible center of the points
// (assuming the algorithm can distinguish distinct clusters of said
// points. Perhaps it starts from top-down, further distinguishing
// different clusters of same-colored points, as they do not conform
// to a known shape pattern). The algorithm could use this distance
// from center calculation to determine if a cluster is a shape based
// on a previously learned shape pattern (such as how a circle's edge
// -points will all be somewhat-equidistant from the center).


// Update 03.13.18 
// One way we extrapolate shapes from sparse data is by superimposing
// learned, dense or complex shapes (imagine pacman, facing rightwards)
// onto the data and verifying visually whether the sparse data has points
// that lie along the contour of the superimposition. We care less
// if it has extra data outside of the superimposition contour, as long as
// the data points that lie along the contour are distinct enough. Therefore
// a sparse dataset itself has no quality that an algorithm should be able to
// use to discern a denser shape, unless it has already learned that shape
// (such as a circle, pacman, etc). The challenge is now to determine how an
// algorithm can come up with a generalized "shape" memory that can be said to be
// a "scale space representation" of the exact shape used to learn;
// our concept of "circle" isn't jsut the exact parameters of the first circle
// we learned, or even a composite of the first several or several thousand, but
// every shape we clearly see that is a circle we can identify as "circular".


/*
notes:

First, env must be instantiated.
- On click of a sqmeter, a point must be instantiated:
    - point should be added visually to the env
    - new pairs should be genned that contain the new point
        - determine whether the new point is a new lowXY
        - the array of pairs already exists
        - create a new array of pairs that contain the new point (for each point, create a new pair with new point)
        - add the new array to the old one
        
*/
var env = new Object();
    env.height = 30;
    env.width = 30;
    env.area = env.height * env.width;

    // fields to be updated on every point add:
    env.avg_radius = 0;
    env.sorted_points_arr = []; // sorted by distance from the center
    env.pairs = [];
    env.angle_arr = [];
    env.lowXY = "";
    env.greatest_angle_wrt_lowXY = 0; // must be brute-updated on every point-add that creates a new lowXY
    env.lowXY_pairs = [];
    env.hull = [];



    env.instantiate = function() {
        for (var i = 0; i < env.height; i++) {
            var row = [];
            var tr = "<tr></tr>";
            for (var j = 0; j < env.width; j++) {
                var id = (i * env.height) + j;
                var td = "<td id=\"x_" + id + "\" class=\"sqmeter\"></td>";
                td = $(td).data("x", (j + 1)  );
                td = $(td).data("y", (env.height - i)  );
                tr = $(tr).append(td);
                row.push(0);
            }
            $("#universe").append(tr);
        }
    };

    env.inst_point = function($this) {
        $this.addClass("point");
        env.findcenter();
        env.find_avg_radius();
        env.which_points_within_avg_rad();
        env.recount();
        env.inst_distinct_pairs();
        env.inst_lowXY($this);
        // env.lowXY_pairs = env.pairs_with_point(env.lowXY);
        // env.angle_selection_sort();
        // env.convex_hull();
    };

    env.inst_lowXY = function($this) {

        if (env.lowXY == "") {
            env.lowXY = $this;
        } else {
            var $t_x = $this.data("x");
            var $t_y = $this.data("y");
            var $c_x = env.lowXY.data("x");
            var $c_y = env.lowXY.data("y");
            if ($t_y < $c_y || ($t_y == $c_y && $t_x < $c_x)) {
                env.lowXY = $this;
                env.lowXY_pairs = env.pairs_with_point(env.lowXY);
                for (var i = 0; i < env.lowXY_pairs.length; i++) {
                    if (env.lowXY_pairs[i].__angle_deg > env.greatest_angle_wrt_lowXY) {
                        env.greatest_angle_wrt_lowXY = env.lowXY_pairs[i].__angle_deg; // cannot update lowest angle only when new lowXY
                    }
                }
            }
        }

    };

    env.findcenter = function() {
        var cluster = [];
        var center = [0, 0];
        $(".point").each(function() {
            var point = [$(this).data("x"), $(this).data("y")];
            cluster.push(point);
        });
        
        for (var i = 0; i < cluster.length; i++) {
            center[0] += cluster[i][0];
            center[1] += cluster[i][1];
        }
        center[0] = Math.round(center[0] / cluster.length);
        center[1] = Math.round(center[1] / cluster.length);
        $(".target").removeClass("target");
        $(".sqmeter").each(function() {
            if ($(this).data("x") === center[0] && $(this).data("y") === center[1]) {
                $(this).addClass("target");
            }
        });
    };

    env.find_avg_radius = function() {
        var cum_avg = 0;
        $(".point").each(function() {
            cum_avg += env.distance($(this), $(".target"));
        });
        cum_avg /= $(".point").length;
        env.avg_radius = cum_avg;
        return Math.round(cum_avg);
    };

    env.distance = function($point_1, $point_2) {
        var dist = Math.sqrt(Math.pow(($point_1.data("x") - $point_2.data("x")), 2) + Math.pow(($point_1.data("y") - $point_2.data("y")), 2));
        if (isNaN(dist)) {dist = 0;}
        return dist;
    };

    env.which_points_within_avg_rad = function() {
        $(".within-avg").removeClass("within-avg");
        $(".point").each(function() {
            if (env.distance($(this), $(".target")) <= env.avg_radius) {
                $(this).addClass("within-avg");
            }
        });
    };

    env.qs_quicksort = function(arr, left, right) {
        var pivot, partition_index;
        
        if (left < right) {
            partition_index = env.qs_partition(arr, left, right);
            
            env.qs_quicksort(arr, left, partition_index - 1);
            env.qs_quicksort(arr, partition_index + 1, right);
        }
        return arr;
    };

        env.qs_partition = function(arr, left, right_pivot) {
            var pivot_val = arr[right_pivot][1],
                partition_index = left;

            // swaps items less than pivot with the partition,
            // moving the partition right as elements smaller
            // than the pivot are placed to the right of the
            // partition
            for (var i = left; i < right_pivot; i++) {
                
                // > for descending, < for ascending
                if (arr[i][1] > pivot_val) {
                    env.qs_swap(arr, i, partition_index);
                    partition_index++;
                }
            }

            // finally, swaps the element to the right of the
            // partiton with the pivot, or right-most element
            env.qs_swap(arr, right_pivot, partition_index);
            return partition_index;
        };

        env.qs_swap = function(arr, i, j) {
            var temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        };

    env.recount = function() {
        env.sorted_points_arr = [];
        var lowest_y = $(".point").eq(0);
        var lowest_y_val = $(".point").eq(0).data("y");
        var lowest_x_val = $(".point").eq(0).data("x");
        $(".point").each(function() {
            // Sort by distance
            var dist = Math.round((env.distance($(this), $(".target")) + 0.00001) * 100) / 100;
            var this_point = [$(this), dist];
            
            // Sort by 
            
            env.sorted_points_arr.push(this_point);
            
            // Store point with lowest y-coordinate
            if ($(this).data("y") == lowest_y_val) {
                if ($(this).data("x") <= lowest_x_val) {
                    lowest_y = $(this);
                    lowest_y_val = $(this).data("y"); 
                    lowest_x_val = $(this).data("x"); 
                }
            } else if ($(this).data("y") < lowest_y_val) {
                lowest_y = $(this);
                lowest_y_val = $(this).data("y");
                lowest_x_val = $(this).data("x");
            }
        });
        env.lowXY = lowest_y;
        env.qs_quicksort(env.sorted_points_arr, 0, env.sorted_points_arr.length - 1);
    };


function temp_push(arr, $thing) {
    arr.push($thing);
    $($thing).addClass("hull");
}function temp_pop(arr) {
    $(".hull").removeClass("hull");
    arr.pop();
    for (var i = 0; i < arr.length; i++) {
        $(arr[i]).addClass("hull");
    }
}

    env.convex_hull_old = function() {
        $(".hull").removeClass("hull");
        var hull = [];
        var points = [];
        if ($(".point").length > 0) {
            for (var i = 0; i < env.angle_arr.length; i++) {
                points.push($(env.angle_arr[i][0])[0]);
            }
            points.push(env.lowXY[0]);
            points = points.reverse();
//            hull.push(points[0]);
//            hull.push(points[1]);
            
            temp_push(hull, points[0]);
//            temp_push(hull, points[1]);
            
            for (var i = 0; i < points.length; i++) {
                
                $(".current").removeClass("current");
                $(points[i]).addClass("current");
                
                if (points.length >= 3 && i >= 1) {
                    if (env.ccw($(hull[hull.length-2]), $(hull[hull.length-1]), $(points[i])) > 0) {
//                        hull.push(points[i]);
                        temp_push(hull, points[i]);
                    } else {
                        var ccw0 = 2;
                        var ccw1 = 1;
                        var collinear_arr = [];
                        while (hull.length >= 2 && env.ccw($(hull[hull.length-ccw0]), $(hull[hull.length-ccw1]), $(points[i])) <= 0) {
//                            hull.pop();
                            temp_pop(hull);
                            
                            /////
//                            if ( env.ccw($(hull[hull.length-ccw0]), $(hull[hull.length-ccw1]), $(points[i])) < 0 ) { console.log("not collinear");
//                                temp_pop(hull);
//                                for (var j = 0; j < collinear_arr.length; j++) {
//                                    temp_pop(hull);
//                                }
//                            } else {
//                                collinear_arr.push(hull[hull.length-ccw1]);
//                            }
//                            ccw0++;
//                            ccw1++;
                            /////
                            
                        }
//                        hull.push(points[i]);
                        temp_push(hull, points[i]);
                    }
                }
            }
//            for (var i = 0; i < hull.length; i++) { console.log(i);
//                $(hull[i]).addClass("hull");
//            }
            env.hull = hull;
            return env.hull;
        }
    };

    env.convex_hull = function() {
        $(".hull").removeClass("hull");
        var hull = [];
        var points = [];
        if ($(".point").length > 0) {
            for (var i = 0; i < env.angle_arr.length; i++) {
                points.push($(env.angle_arr[i][0])[0]);
            }
            points.push(env.lowXY[0]);
            points = points.reverse();
//            hull.push(points[0]);
//            hull.push(points[1]);
            
            temp_push(hull, points[0]);
//            temp_push(hull, points[1]);
            
            for (var i = 0; i < points.length; i++) {
                
                $(".current").removeClass("current");
                $(points[i]).addClass("current");
                
                if (points.length >= 3 && i >= 1) {
                    if (env.ccw($(hull[hull.length-2]), $(hull[hull.length-1]), $(points[i])) > 0) {
//                        hull.push(points[i]);
                        temp_push(hull, points[i]);
                    } else {
                        var ccw0 = 2;
                        var ccw1 = 1;
                        var collinear_arr = [];
                        while (hull.length >= 2 && env.ccw($(hull[hull.length-ccw0]), $(hull[hull.length-ccw1]), $(points[i])) <= 0) {
//                            hull.pop();
//                            temp_pop(hull);
                            
                            /////
                            if ( env.ccw($(hull[hull.length-ccw0]), $(hull[hull.length-ccw1]), $(points[i])) < 0 ) {
                                temp_pop(hull);
                                for (var j = 0; j < collinear_arr.length; j++) {
                                    temp_pop(hull);
                                }
                                ccw0 = 2;
                                ccw1 = 1;
                            } else {
                                collinear_arr.push(hull[hull.length-ccw1]);
                                ccw0++;
                                ccw1++;
                            }
                            /////
                            
                        }
//                        hull.push(points[i]);
                        temp_push(hull, points[i]);
                    }
                }
            }
//            for (var i = 0; i < hull.length; i++) { console.log(i);
//                $(hull[i]).addClass("hull");
//            }
            env.hull = hull;
            return env.hull;
        }
    };

    env.ccw = function($p1, $p2, $p3) {
        return (($p2.data("x") - $p1.data("x"))*($p3.data("y") - $p1.data("y")) - ($p2.data("y") - $p1.data("y"))*($p3.data("x") - $p1.data("x")));
    };

    // Verify by n-choose-k: n! / k!(n-k)! number of pairs, given n number of points
    env.inst_distinct_pairs = function() {
        env.pairs = [];
        $(".point").each(function(index) {
            $(".point").each(function() {
                var pair = new Pair($(this), $(".point").eq(index));
                if (!pair.isIdentityPair() && !pair.arrContainsPair(env.pairs)) {
                    env.pairs.push(pair);
                }
            });
        });
    };

    env.pairs_with_point = function($p) {
        var common_pairs_arr = [];
        for (var i = 0; i < env.pairs.length; i++) {
            if ($p.is($(env.pairs[i]._a)) || $p.is($(env.pairs[i]._b))) {
                common_pairs_arr.push(env.pairs[i]);
            }
        }
        return common_pairs_arr;
    };

env.angle_selection_sort_old = function() {
    env.angle_arr = [];
    var common = env.pairs_with_point(env.lowXY);
    for (var i = 0; i < common.length; i++) {
        for (var j = i; j < common.length; j++) {
            if (common[j].__angle_deg < common[i].__angle_deg) {
                var temp = common[i];
                common[i] = common[j];
                common[j] = temp;
            }
        }
    }
    
    console.log(common);
    for (var i = 0; i < common.length; i++) {
        if ($(common[i]._a).is(env.lowXY)) {
            env.angle_arr.push([common[i]._b, common[i].__angle_deg]);
        } else {
            env.angle_arr.push([common[i]._a, common[i].__angle_deg]);
        }
    }
    return env.angle_arr;
};

env.angle_selection_sort = function() {
    env.angle_arr = [];
    var common = env.pairs_with_point(env.lowXY);
    for (var i = 0; i < common.length; i++) {
        for (var j = i; j < common.length; j++) {
            if (common[j].polar_angle_less_than(common[i])) {
                var temp = common[i];
                common[i] = common[j];
                common[j] = temp;
            }
        }
    }
    /// printing
    var text = "";
    for (var i = 0; i < common.length; i++) {
        console.log(common[i].not_lowXY);
        text += $(common[i].not_lowXY).attr("id") + "\n";
    }
//    console.log(text);
    ///
    
    for (var i = 0; i < common.length; i++) {
        if ($(common[i]._a).is(env.lowXY)) {
            env.angle_arr.push([common[i]._b, common[i].__angle_deg]);
        } else {
            env.angle_arr.push([common[i]._a, common[i].__angle_deg]);
        }
    }
    return env.angle_arr;
};

    env.heapsort = function() {}; // do later, replace the above

    env.prune_points = function() {
        if (env.hull.length) {
            $(".point").each(function() {
                if (!env.hull.includes($(this)[0])) {
                    $(this).removeClass("point hull current");
                }
            });
            env.findcenter();
            env.find_avg_radius();
            env.which_points_within_avg_rad();
            env.recount();
            env.inst_distinct_pairs();
        }
    };

//// Pairs Constructor

function Pair($a, $b) {
    this._a = $a[0];
    this._b = $b[0];
    
    this.equal = function(pair) {
        try {
            if ( ($(this._a).is($(pair._a)) && $(this._b).is($(pair._b))) ||
                ($(this._a).is($(pair._b)) && $(this._b).is($(pair._a))) ) {
                return true;
            } else {
                return false;
            }
        } catch(e) {
            console.error("Error: Invalid pair object comparison.");
        }
    };
    
    this.has_point = function($p) {
        if ($p.is($(this._a)) || $p.is($(this._b))) {
            return true;
        } else {
            return false;
        }
    }
    
    this.isIdentityPair = function() {
        if ($(this._a).is($(this._b))) {
            return true;
        } else {
            return false;
        }
    };
    
    this.arrContainsPair = function(arr) {
        for (var i = 0; i < arr.length; i++) {
            if (this.equal(arr[i])) {
                return true;
            }
        } return false;
    };

    this.__slope = (function() {
        var y_diff = ($b.data("y") - $a.data("y"));
        var x_diff = ($b.data("x") - $a.data("x"));
        var slope = Math.round((y_diff / x_diff) * 100) / 100;
        return Math.round(slope * 100) / 100;
        //return Math.abs(Math.round(slope * 100) / 100);
    })();
    
    this.__dist = (function() {
        var temp = Math.pow(($a.data("x") - $b.data("x")), 2) + Math.pow(($a.data("y") - $b.data("y")), 2);
        var dist = Math.sqrt(temp);
        if (isNaN(dist)) {dist = 0;}
        return Math.round(dist * 100) / 100;
        //return Math.abs(Math.round(dist * 100) / 100);
    })();
    
    this.__angle_deg = (function(slope, haspoint, lowest_y_angle) {
        var angleRad = Math.atan(slope);
        var angleDeg = angleRad * 180 / Math.PI;
        if (angleDeg < 0) {
            angleDeg = Math.abs(angleDeg);
        } else if (angleDeg > 0) {
            angleDeg = 180 - angleDeg;
        } else if (angleDeg == 0) {
            angleDeg = 180;
        }
        angleDeg = Math.round(angleDeg * 100) / 100;
        
//        if (haspoint && angleDeg > env.greatest_angle_wrt_lowXY) {
//            env.greatest_angle_wrt_lowXY = angleDeg;
//        }
        
        return angleDeg;
    })(this.__slope, this.has_point($(env.lowXY)));
    
    this.polar_angle_less_than = function(pair) {
        
        var p1 = $(this.not_lowXY);
        var p2 = $(pair.not_lowXY);
        var alt_angle = pair.__angle_deg;
        
        var lt = false;
        if (!this.equal(pair)) {
            if (this.__angle_deg < alt_angle) {
                lt = true;
            }
            /* pseudo--
                mark lt = true if:
                 - collinear with lowXY horizontally (sorting right from left, becuase in this case lowXY is always leftmost)
                 - collinear with lowXY vertically -- 2 cases:
                    - case 1: vertical axis points have env.greatest_angle_wrt_lowXY, then sort ascending by distance from lowXY
                    - case 2: not env.greatest_angle_wrt_lowXY, so sort descending by distance from lowXY
                 - collinear with lowXY in the NW or the NE diagonals -- 2 cases:
                    - NW xor NE diagonal has points env.greatest_angle_wrt_lowXY, in which case should be sorted ascending by distance from lowXY
                    - else they don't, and should be sorted in descending distance from lowXY
            */
            else if (this.__angle_deg == alt_angle) {
                if (this.__angle_deg == env.greatest_angle_wrt_lowXY) {
                    if (p1.data("x") > p2.data("x") || p1.data("y") > p2.data("y")) {
                        lt = true;
                    }
                    
                } else {
                    if (p1.data("x") < p2.data("x") || p1.data("y") < p2.data("y")) {
                        lt = true;
                    }
                }
            }
        } return lt;
    };
    
    this.not_lowXY = (function(a, b) {
        if ($(a).is(env.lowXY)) {
            return b;
        } else {
            return a;
        }
    })(this._a, this._b);
}

//// Window.onload

var a = "";
var ddd = "";
$(window).on("load", function() {
    env.instantiate();
    $(".sqmeter").click(function() {
        env.inst_point($(this));
    });
    
    $(".sqmeter").mouseenter(function(e) { $("#hover-slope").empty();
        if ($(this).hasClass("point")) { console.log("point hover");
            for (var i = 0; i < env.lowXY_pairs.length; i++) {
                if (env.lowXY_pairs[i].has_point($(this))) {
                    $("#hover-slope").addClass("shown");
                    var slope = env.lowXY_pairs[i].__slope;
                    var angleDeg = env.lowXY_pairs[i].__angle_deg;
                    
                    var text = "x: " + $(this).data("x") + " | ";
                    text += "y: " + $(this).data("y") + " | ";
                    if (!$(this).is(env.lowXY)) {
                        text += "slope: " + slope + " | ";
                        text += "angleDeg: " + angleDeg + " | ";
                    }
                    $("#hover-slope").text(text);
                    var top  = (e.clientY - 40)  + "px";
                    var left  = e.clientX  + "px";
                    $("#hover-slope").css("top", top);
                    $("#hover-slope").css("left", left);
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            }
        }
    }).mouseleave(function() {
        if ($(this).hasClass("point")) {
            $("#hover-slope").removeClass("shown");
        }
    });

    // Prelim. hull testing
//    $("#x_731").click();
//    $("#x_648").click();
//    $("#x_525").click();
//    $("#x_441").click();
//    $("#x_405").click();
//    $("#x_164").click();
//    $("#x_401").click();
//    $("#x_305").click();
//    $("#x_487").click();
//    $("#x_666").click();
//    $("#x_669").click();

    // Advanced hull testing (weird down-the-middle bug)
//    $("#x_586").click();
//    $("#x_529").click();
//    $("#x_496").click();
//    $("#x_466").click();
//    $("#x_523").click();
//    $("#x_525").click();
//    $("#x_526").click();
//    $("#x_556").click();
//    $("#x_557").click();
//    $("#x_371").click();
    
    // square
//    $("#x_493").click();
//    $("#x_494").click();
//    $("#x_495").click();
//    $("#x_523").click();
//    $("#x_525").click();
//    $("#x_553").click();
//    $("#x_554").click();
//    $("#x_555").click();
    
    // triangle
    
    $("#x_346").click();
    $("#x_376").click();
    $("#x_406").click();
    $("#x_436").click();
    $("#x_466").click();
    $("#x_496").click();
    $("#x_526").click();
    $("#x_556").click();
    $("#x_586").click();
    $("#x_316").click();
    $("#x_347").click();
    $("#x_378").click();
    $("#x_409").click();
    $("#x_440").click();
    $("#x_500").click();
    $("#x_558").click();
    $("#x_471").click();
    $("#x_587").click();
    $("#x_529").click();
    $("#x_616").click();
    
    // other triangle
//    $("#x_371").click();
//    $("#x_342").click();
//    $("#x_429").click();
//    $("#x_458").click();
//    $("#x_487").click();
//    $("#x_400").click();
//    $("#x_373").click();
//    $("#x_404").click();
//    $("#x_435").click();
//    $("#x_466").click();
//    $("#x_497").click();
//    $("#x_528").click();
//    $("#x_527").click();
//    $("#x_526").click();
//    $("#x_525").click();
//    $("#x_524").click();
//    $("#x_523").click();
//    $("#x_522").click();
//    $("#x_521").click();
//    $("#x_520").click();
//    $("#x_519").click();
//    $("#x_518").click();
//    $("#x_517").click();
//    $("#x_516").click();
    
    // northeast diagonal
//    $("#x_616").click();
//    $("#x_587").click();
//    $("#x_558").click();
//    $("#x_529").click();
//    $("#x_500").click();
//    $("#x_471").click();
    
    // test of initial if-loop
//    $("#x_551").click();
//    $("#x_251").click();
//    $("#x_320").click();
//    $("#x_561").click();
//    $("#x_708").click();
    
    $("#convex_hull_btn").click(function() {
        env.lowXY_pairs = env.pairs_with_point(env.lowXY);
        env.angle_selection_sort();
        env.convex_hull();
    });
        
    $("#prune_points_btn").click(function() {
        env.prune_points();
        
    });
    
});



// RETIRED FUNCTIONS
//
//
//    env.sorted_vertices = new Object();
//        env.sorted_vertices.size = 0;
//        env.sorted_vertices.root = null;
//
//    // Works, but won't cut it. values change every time point is added.
//    // Point node Binary Search Tree  - Insert
//    env.vertex_BST_insert = function($this) {
//        var dist = Math.round(env.distance($this, $(".target")));
//        var this_point = ["#" + $this.attr("id"), dist];
//        var this_node = new Object();
//            this_node.val = this_point;
//            this_node.dupes = [];
//            this_node.left = null;
//            this_node.right = null;
//        var curr = env.sorted_vertices.root;
//        var prev_curr = null;
//        if (env.sorted_vertices.size === 0) {
//            env.sorted_vertices.root = this_node;
//            env.sorted_vertices.size++;
//        } else {
//            
//            while (curr !== null) {
//                prev_curr = curr;
//                if (this_point[1] > curr.val[1]) {
//                    curr = curr.right;
//                } else if (this_point[1] < curr.val[1]) {
//                    curr = curr.left;
//                } else if (this_point[1] == curr.val[1]) {
//                    curr.dupes.push(this_point);
//                    curr = null;
//                    env.sorted_vertices.size++;
//                }
//            }
//            if (curr === null && !prev_curr.dupes.includes(this_point)) {
//                if (this_point[1] > prev_curr.val[1]) {
//                    prev_curr.right = this_node;
//                } else if (this_point[1] < prev_curr.val[1]) {
//                    prev_curr.left = this_node;
//                }
//                env.sorted_vertices.size++;
//            }
//        }
//    };





