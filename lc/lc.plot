set terminal png nocrop noenhanced size 1000,1000
set datafile missing "null"
set yrange [0:1]
set grid ytics
set grid xtics
set key bottom right
set key autotitle columnhead

set ytics 0,0.1,1
set xtics nomirror
set autoscale xfix
set xlabel 'Number of dialogues'
