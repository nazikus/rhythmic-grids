clc; clear; close all;
addpath('./Tests/');

result = runtests('GenerateRhythmicGridTest');
disp(table(result))