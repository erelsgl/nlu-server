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

count = 0


file = File.new("ppdb-1.0-m-all", "r")
#file = File.new("ppdb", "r")
while (line = file.gets)
    list = line.split("|||")
    param = list[3].split
    list[1].strip!
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

   STDOUT.write(gen_redis_proto([["SADD",list[1],list[2].strip!]#,
				#["HSET",list[1],'p(e|f)',param[26].split("=")[1]],
				#["HSET",list[1],'p(f|e)',param[29].split("=")[1]]
				]))

#))
end

#(0...200).each{|n|
#    STDOUT.write(gen_redis_proto("SET","11 22","33 44 55"))
#}

