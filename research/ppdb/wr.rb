def gen_redis_proto(lst)
proto = ""
lst.each do |cmd|	
    proto << "*"+cmd.length.to_s+"\r\n"
    cmd.each{|arg|
        proto << "$"+arg.to_s.bytesize.to_s+"\r\n"
        proto << arg.to_s+"\r\n"
    }
end
    proto
end

def score(param)
  return param['p(e|f)'] + param['p(f|e)'] + param['p(e|f,LHS)'] + param['p(f|e,LHS)'] + 
        100*param['RarityPenalty'] +0.3*param['p(LHS|e)'] + 0.3*param['p(LHS|f)']

end

def extract(parapstring)
  parammain = {}
  param = parapstring.split(" ")
    param.each do |paramelement|
      paramelementlist = paramelement.split("=")
      parammain[paramelementlist[0]] = paramelementlist[1].to_f
    end
  return parammain
end

count = 0

file = File.new("ppdb-1.0-s-all", "r")
#file = File.new("ppdb", "r")
while (line = file.gets)
    parammain = {}
    list = line.encode('UTF-8', :invalid => :replace).split("|||")
    parammain = extract(list[3])
    cur_score = score(parammain)
   
	 
    list[0] = list[0].encode('UTF-8', :invalid => :replace)
    list[1] = list[1].encode('UTF-8', :invalid => :replace)
    list[2] = list[2].encode('UTF-8', :invalid => :replace)

    list[0] = list[0].strip
    list[0] = list[0][1..-2]

    list[1] = list[1].strip
    list[2] = list[2].strip

#    puts param[26].split("=")[1]
#    puts param[29].split("=")[1]
#    puts param[29]
#    Process.exit(0)
    count = count + 1
    if count % 100000 == 0
	filew = File.new("/tmp/some_file", "a")
        filew.write(count)
	filew.close
    end
#HSET myhash field1 "Hello"
   # STDOUT.write(gen_redis_proto("SET",list[1].strip!,list[2].strip!))
   # STDOUT.write(gen_redis_proto("HSET",list[1].strip!,'string',list[2].strip!))
   # STDOUT.write(gen_redis_proto("HSET",list[1].strip!,'p(e|f)',param[26].split("=")[1]))
   # STDOUT.write(gen_redis_proto("HSET",list[1].strip!,'p(f|e)',param[29].split("=")[1]))

   STDOUT.write(gen_redis_proto([["ZADD",list[1],cur_score,list[2]+"^"+list[0]]#,
				#["HSET",list[1],'p(e|f)',param[26].split("=")[1]],
				#["HSET",list[1],'p(f|e)',param[29].split("=")[1]]
				]))

#))
end

#(0...200).each{|n|
#    STDOUT.write(gen_redis_proto("SET","11 22","33 44 55"))
#}

