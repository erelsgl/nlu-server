set terminal png nocrop enhanced size 900,640 font "arial,8"
#set output '/tmp/heatmaps.2.png'
##set dgrid3d 10,10 splines
unset key
set ylabel 'train size'
set xtics 1
set ytics 1
set view 60, 75, 1, 1
set xlabel 'sentences'
#set hidden3d back offset 1 trianglepattern 3 undefined 1 altdiagonal bentover

##set style data lines

##set pm3d

#set palette
#set palette defined (0 "blue", 1 "red")
set palette defined (-0.15 "red", 0 "white", 0.15 "blue")
ub = 0.15
lb = -ub
set cbrange [lb:ub]
x = 0.0
y = 0.0
## Last datafile plotted: "gnu-valley"
#splot "/tmp/learning_curves/map_0_F1_TCBOC-TC" u 1:2:3 w lines
