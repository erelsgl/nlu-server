#set terminal pdf monochrome size 1000,1000
set terminal png nocrop noenhanced size 1000,1000
set datafile missing "null"
set yrange [0:0.7]
set grid ytics
set grid xtics
set key bottom right
set key autotitle columnhead

set key font ",25"
set ytics 0,0.1,1
set xtics nomirror
#set xtics rotate by -90
set autoscale xfix
#set xlabel 'Utterances'
set lmargin 11
set xlabel 'Utterances' font ",25"
set ylabel 'macro-F1' font ",25" offset 0,0

