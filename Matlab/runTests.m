clc; clear; close all;
addpath('./Utils/');

result = runtests('GenerateRhythmicGridTest');
disp(table(result))