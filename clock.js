// Copyright (c) 2010-2015 Misha Dynin.  All rights reserved.
// Built with Raphaël http://raphaeljs.com/

var cast_mode;

var clock_width;
var clock_height;

var zoom;

var center_x;
var center_y;

var dot_circle;
var dot_radius;
var dot_fill = 'white';

var center_radius;
var center_fill = 'white';

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

var demo_mode;
var current_date;
var display_timout_msec = 500;

var paper;
var hour_hand;
var hour_label;
var hour_background;
var minute_hand;
var minute_label;

var last_hour = -1;
var last_minute = -1;

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

  dot_circle = 200 * zoom;
  dot_radius = 3 * zoom;

  center_radius = 8 * zoom;

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

  for (var i = 0; i < 12; ++i) {
    var x = center_x + Math.sin(2 * Math.PI * i / 12) * dot_circle;
    var y = center_y - Math.cos(2 * Math.PI * i / 12) * dot_circle;
    var dot = paper.circle(x, y, dot_radius);
    fill(dot, dot_fill);
  }

  var circle = paper.circle(center_x, center_y, center_radius);
  fill(circle, center_fill);

  draw_signature();

  set_mode(!cast_mode);
  current_date = new Date();
  display_clock();
}

function is_cast_mode() {
  // The switch mode is present on the web page but not the receiver page.
  return document.getElementById('mode') ? false : true;
}

function describe(is_demo) {
  return is_demo ? 'Demo Mode' : 'Real Time';
}

function set_mode(is_demo) {
  demo_mode = is_demo;
  if (!cast_mode) {
    document.getElementById('mode').innerHTML = 'In ' + describe(is_demo) + '.';
    document.getElementById('b1').innerHTML = 'Click to switch to ' + describe(!is_demo);
  }
}

function clicked() {
  set_mode(!demo_mode);
}

function display_clock() {
  if (demo_mode) {
    current_date = new Date(current_date.getTime() + 60 * 1000);
  } else {
    current_date = new Date();
  }
  show_time(current_date);
  setTimeout('display_clock()', display_timout_msec);
}

function show_time(date) {
  var new_hour = date.getHours() % 12;
  var new_minute = date.getMinutes();

  if (new_hour != last_hour || new_minute != last_minute) {
    draw_hour(new_hour, new_minute);
    draw_minute(new_minute);
    last_hour = new_hour;
    last_minute = new_minute;
  }
}

function draw_signature() {
  var sig_font_size = minute_font_size * 0.4;
  var padding = cast_mode ? sig_font_size : 0;
  make_text(clock_width - sig_font_size * 2 - padding,
      clock_height - sig_font_size - padding,
      "M.D.'15", sig_font_size, '#686868');
}

function draw_hour(hour, minute) {
  if (hour_hand == null) {
    hour_hand = paper.rect(center_x - hour_width / 2,
	center_y - hour_len, hour_width, hour_len,
	hour_width / 2);
    fill(hour_hand, center_fill);
  }
  hour_hand.rotate(hour / 12 * 360 + minute / 60 * 30, center_x, center_y);

  var x = center_x + Math.sin(2 * Math.PI * hour / 12) * hour_circle;
  var y = center_y - Math.cos(2 * Math.PI * hour / 12) * hour_circle;

  if (hour_label != null) {
    hour_label.remove();
  }
  if (hour_background != null) {
    hour_background.remove();
  }

  hour_background = paper.circle(x, y, hour_background_radius);
  fill(hour_background, hour_background_fill);

  var text = (hour > 0 ? hour : 12).toString();
  hour_label = make_text(x, y, text, hour_font_size, hour_fill);
  // hour_label.attr('font-weight', 'bold');
}

function draw_minute(minute) {
  var start_angle;
  var end_angle;
  var prerotate;
  if (minute == 0) {
    start_angle = 59 / 60 * 360;
    end_angle = 360;
    prerotate = true;
  } else if (minute == 1) {
    start_angle = 0;
    end_angle = minute / 60 * 360;
    prerotate = true;
  } else {
    start_angle = (minute - 1) / 60 * 360;
    end_angle = minute / 60 * 360;
    prerotate = false;
  }

  if (minute_hand == null) {
    minute_hand = paper.rect(center_x - minute_width / 2,
	center_y - minute_len, minute_width, minute_len,
	minute_width / 2);
    fill(minute_hand, center_fill);
    minute_hand.rotate(end_angle, center_x, center_y);
  } else {
    if (transition_animate) {
      if (prerotate) {
	minute_hand.rotate(start_angle, center_x, center_y);
      }
      minute_hand.animate({'rotation' : end_angle + " " + center_x + " " +
	  center_y }, transition_msec);
    } else {
      minute_hand.rotate(end_angle, center_x, center_y);
    }
  }

  if (minute_label != null) {
    minute_label.remove();
  }

  var x = center_x + Math.sin(2 * Math.PI * minute / 60) * minute_circle;
  var y = center_y - Math.cos(2 * Math.PI * minute / 60) * minute_circle;
  var text = minute < 10 ? ('0' + minute.toString()) : minute.toString();
  minute_label = make_text(x, y, text, minute_font_size, minute_fill);
  if (transition_animate) {
    minute_label.rotate(start_angle - end_angle, center_x, center_y);
    minute_label.animate({'rotation' : "0 " + center_x + " " +
	  center_y }, transition_msec);
  }
}

function make_text(x, y, text, font_size, fill_color) {
  var text_object = paper.text(x, y, text);
  text_object.attr('font-size', font_size);
  text_object.attr('font-family', font_family);
  fill(text_object, fill_color);
  return text_object;
}

function fill(object, color) {
  object.attr('stroke-width', 0);
  object.attr('fill', color);
}
