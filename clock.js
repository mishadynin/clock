// Copyright (c) 2010-2017 Misha Dynin.  All rights reserved.
// Built with Raphaël http://raphaeljs.com/

var cast_mode;

var clock_width;
var clock_height;

var zoom;

var center_x;
var center_y;

var animate_marks = true;

var mark_circle;
var mark_radius;
var mark_fill = 'white';

var font_family = "'Alegreya Sans SC', Helvetica, sans-serif";
var font_zoom = 1.2; // Scale up Alegreya Sans SC glyphs

var hour_len;
var hour_width;
var hour_circle;
var hour_fill = 'white';
var hour_font_size;
var hour_background_radius;
var hour_background_fill = 'black';

var minute_len;
var minute_width;
var minute_circle;
var minute_fill = 'white';
var minute_font_size;

var transition_animate = true;
var transition_msec = 150;

var display_timout_msec = 500;

var paper;
var hour_hand;
var hour_label;
var hour_background;
var minute_hand;
var minute_label;
var marks_list;

var last_hour = -1;
var last_minute = -1;
var last_second = -1;

var translate_x = 0;
var translate_y = 0;
var translate_z = 1;

var two_pi = 2 * Math.PI;

function init_clock() {
  cast_mode = is_cast_mode();

  if (cast_mode) {
    clock_width = 1280;
    clock_height = 720;
    zoom = 1.3;
  } else {
    clock_width = 970;
    clock_height = 600;
    zoom = 1;
  }

  center_x = clock_width / 2;
  center_y = clock_height / 2;

  mark_circle = 200 * zoom;
  mark_radius = 3 * zoom;

  hour_len = 110 * zoom;
  hour_width = 6 * zoom;
  hour_circle = 150 * zoom;
  hour_font_size = 48 * zoom * font_zoom;
  hour_background_radius = 27 * zoom;

  minute_len = 175 * zoom;
  minute_width = 4 * zoom;
  minute_circle = 240 * zoom;
  minute_font_size = 32 * zoom * font_zoom;

  paper = Raphael('clock', clock_width, clock_height);

  var background = paper.rect(0, 0, clock_width, clock_height);
  background.attr('fill', 'black');

  draw_signature();

  display_clock();
}

function is_cast_mode() {
  // The switch mode is present on the web page but not the receiver page.
  return document.getElementById('modeform') ? false : true;
}

function get_mode() {
  if (cast_mode) {
    return 'real';
  } else {
    return document.getElementById('modeform')['mode'].value;
  }
}

function get_integer(input_id) {
  var result = parseInt(document.getElementById(input_id).value, 10);

  if (isNaN(result) || result < 0) {
    return 0;
  }

  return result;
}

function display_clock() {
  var date = new Date();
  var hour = date.getHours();
  var minute = date.getMinutes();
  var second = date.getSeconds();

  var mode = get_mode();

  if (mode == 'demo') {
    if (last_hour != -1) {
      minute = last_minute + 1;
      if (minute < 60) {
        hour = last_hour;
      } else {
        hour = (last_hour + 1) % 12;
        minute = 0;
      }
    }
  } else if (mode == 'show') {
    hour = get_integer('hour');
    minute = get_integer('minute');
  }

  show_time(hour % 12, minute % 60, second % 60);

  setTimeout('display_clock()', display_timout_msec);
}

function show_time(new_hour, new_minute, new_second) {
  if (new_hour == last_hour && new_minute == last_minute && new_second == last_second) {
    return;
  }

  calculate_translation(new_hour, new_minute);

  draw_marks(new_second);
  last_second = new_second;

  // We must draw minute first, because hour background should be
  // on top of the minute hand.
  draw_minute(new_minute,
      transition_animate && ((new_minute + 59) % 60 == last_minute));
  draw_hour(new_hour, new_minute);

  last_minute = new_minute;
  last_hour = new_hour;
}

function draw_signature() {
  var sig_font_size = minute_font_size * 0.4;
  var padding = cast_mode ? sig_font_size  : 0;
  make_text(clock_width - sig_font_size * 2 - padding,
      clock_height - sig_font_size - padding,
      "M.D.'17", sig_font_size, '#686868');
}

// Translation functions.
function tr_x(x) {
  return x + translate_x;
}

function tr_y(y) {
  return y + translate_y;
}

function tr_z(z) {
  return z * translate_z;
}

var debug_rect = false;
var minutes_r;
var hours_r;
var hoursh_r;
var center_r;
var joined_r;

function draw_r(rect, color) {
  var width = rect.right - rect.left;
  var height = rect.bottom - rect.top;
  var r = paper.rect(tr_x(tr_z(rect.left)),
                     tr_y(tr_z(rect.top)),
                     tr_z(width),
                     tr_z(height));
  fill(r, color);
  return r;
}

function calculate_translation(hour, minute) {
  var minutes_rect = make_rectangle(minute_circle, minute / 60, 1.2 * minute_font_size);
  // var hours_rect = make_rectangle(hour_circle, hour / 12, hour_background_radius * 1.3);
  // var hours_hand_rect = make_rectangle(hour_len, hour / 12 + minute / 60 / 12, 5);
  var center_rect = make_center_rectangle(minute_circle + 1.2 * minute_font_size,
      mark_circle + 7 * mark_radius);

  var joined_rect = join_rectangles(minutes_rect, center_rect);
  //joined_rect = join_rectangles(joined_rect, hours_hand_rect);
  //joined_rect = join_rectangles(joined_rect, center_rect);

  var width = joined_rect.right - joined_rect.left;
  var height = joined_rect.bottom - joined_rect.top;

  var zoom = Math.min(clock_width / width, clock_height / height);
  if (zoom < 1) {
    zoom = 1;
  }

  translate_x = center_x - zoom * (joined_rect.right + joined_rect.left) / 2;
  translate_y = center_y - zoom * (joined_rect.bottom + joined_rect.top) / 2;
  translate_z = zoom;

  if (debug_rect) {
    joined_r = update(draw_r(joined_rect, 'red'), joined_r);

    minutes_r = update(draw_r(minutes_rect, 'blue'), minutes_r);
    // hours_r = update(draw_r(hours_rect, 'blue'), hours_r);
    // hoursh_r = update(draw_r(hours_hand_rect, 'green'), hoursh_r);
    center_r = update(draw_r(center_rect, 'green'), center_r);
  }
}

function make_rectangle(main_radius, angle, end_radius) {
  var x = Math.sin(two_pi * angle) * main_radius;
  var y = - Math.cos(two_pi * angle) * main_radius;

  return { top:    y - end_radius, right: x + end_radius,
           bottom: y + end_radius, left: x - end_radius };
}

function make_center_rectangle(half_width, half_height) {
  return { top:    - half_height, right: half_width,
           bottom:   half_height, left:  - half_width };
}

function join_rectangles(a, b) {
  return { top:    Math.min(a.top, b.top),
           right:  Math.max(a.right, b.right),
           bottom: Math.max(a.bottom, b.bottom),
           left:   Math.min(a.left, b.left) };
}


function draw_marks(second) {
  if (marks_list != null) {
    marks_list.forEach(function(element) { element.remove(); });
    marks_list = null;
  }

  var draw_triangles = animate_marks;
  marks_list = [];

  for (var i = 0; i < 12; ++i) {
    var mark_angle = two_pi * (i / 12);
    var x = tr_x(0) + Math.sin(mark_angle) * tr_z(mark_circle);
    var y = tr_y(0) - Math.cos(mark_angle) * tr_z(mark_circle);
    var mark;

    if (draw_triangles) {
      var angle = mark_angle + two_pi * (second / 60);
      var r = tr_z(mark_radius * 1.5);
      var points = [];
      points.push({ x: x + Math.sin(angle) * r, y: y - Math.cos(angle) * r });
      angle += two_pi / 3;
      points.push({ x: x + Math.sin(angle) * r, y: y - Math.cos(angle) * r });
      angle += two_pi / 3;
      points.push({ x: x + Math.sin(angle) * r, y: y - Math.cos(angle) * r });
      mark = make_path(points);
    } else {
      mark = paper.circle(x, y, tr_z(mark_radius));
    }

    fill(mark, mark_fill);
    marks_list.push(mark);
  }
}

function make_hand(width, len, offset) {
  var wide = 0.5;
  var narrow = 0.2;
  var points = [];

  points.push({ x: tr_x(0) + tr_z(width * wide),
                y: tr_y(0) - tr_z(offset) });
  points.push({ x: tr_x(0) + tr_z(width * narrow),
                y: tr_y(0) - tr_z(len) });
  points.push({ x: tr_x(0) - tr_z(width * narrow),
                y: tr_y(0) - tr_z(len) });
  points.push({ x: tr_x(0) - tr_z(width * wide),
                y: tr_y(0) - tr_z(offset) });

  return make_path(points);
}

function draw_hour(hour, minute) {
  var new_hour_hand = make_hand(hour_width, hour_len, hour_width);
  fill(new_hour_hand, hour_fill);
  new_hour_hand.rotate(hour / 12 * 360 + minute / 60 * 30, tr_x(0), tr_y(0));
  hour_hand = update(new_hour_hand, hour_hand);

  var x = tr_x(0) + Math.sin(two_pi * hour / 12) * tr_z(hour_circle);
  var y = tr_y(0) - Math.cos(two_pi * hour / 12) * tr_z(hour_circle);

  var new_hour_background = paper.circle(x, y, hour_background_radius);
  fill(new_hour_background, hour_background_fill);
  hour_background = update(new_hour_background, hour_background);

  var text = (hour > 0 ? hour : 12).toString();
  var new_hour_label = make_text(x, y, text, tr_z(hour_font_size), hour_fill);
  hour_label = update(new_hour_label, hour_label);
}

function draw_minute(minute, animate) {
  var start_angle;
  var end_angle;

  if (minute == 0) {
    start_angle = 59 / 60 * 360;
    end_angle = 360;
  } else {
    start_angle = (minute - 1) / 60 * 360;
    end_angle = minute / 60 * 360;
  }

  var new_minute_hand = make_hand(minute_width, minute_len, minute_width * 3);
  fill(new_minute_hand, minute_fill);

  if (animate) {
    new_minute_hand.rotate(start_angle, tr_x(0), tr_y(0));
    animate_rotate(new_minute_hand, end_angle, tr_x(0), tr_y(0), transition_msec);
  } else {
    new_minute_hand.rotate(end_angle, tr_x(0), tr_y(0));
  }

  minute_hand = update(new_minute_hand, minute_hand);

  var x = tr_x(0) + Math.sin(two_pi * minute / 60) * tr_z(minute_circle);
  var y = tr_y(0) - Math.cos(two_pi * minute / 60) * tr_z(minute_circle);
  var text = minute < 10 ? ('0' + minute.toString()) : minute.toString();
  var new_minute_label = make_text(x, y, text, tr_z(minute_font_size), minute_fill);
  if (animate) {
    new_minute_label.rotate(start_angle - end_angle, tr_x(0), tr_y(0));
    animate_rotate(new_minute_label, 0, tr_x(0), tr_y(0), transition_msec);
  }
  minute_label = update(new_minute_label, minute_label);
}

function update(new_object, old_object) {
  if (old_object != null) {
    new_object.insertBefore(old_object);
    old_object.remove();
  }
  return new_object;
}

function make_text(x, y, text, font_size, fill_color) {
  var text_object = paper.text(x, y, text);
  text_object.attr('font-size', font_size);
  text_object.attr('font-family', font_family);
  fill(text_object, fill_color);
  return text_object;
}

function make_path(points) {
  var path = '';
  for (var i = 0; i < points.length; ++i) {
    path += (i == 0 ? 'M ' : 'L ') + points[i].x + ' ' + points[i].y;
  }
  path += " z";
  return paper.path(path);
}

function fill(object, color) {
  object.attr('stroke-width', 0);
  object.attr('fill', color);
}

function animate_rotate(object, end_angle, cx, cy, msec) {
  object.animate({'transform' : 'r' + end_angle + ',' + cx + ',' + cy }, msec);
}
